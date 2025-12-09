import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, entries } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('AI Assistant called with action:', action);
    console.log('Number of entries:', entries?.length || 0);

    let systemPrompt = '';
    let userPrompt = '';

    const formattedEntries = entries?.map((e: any, i: number) => `
Entry ${i + 1}: "${e.title}"
Topic: ${e.topic?.name || 'No topic'}
Content: ${e.content || e.summary || 'No content'}
Tags: ${e.tags?.map((t: any) => t.name).join(', ') || 'No tags'}
Status: ${e.status}
---`).join('\n') || 'No entries available';

    if (action === 'smart-search') {
      systemPrompt = `You are an AI assistant for a personal learning journal. Your job is to help users find relevant information from their learning entries and provide insightful answers based on their stored knowledge.

When searching through entries, you should:
1. Find the most relevant entries based on the query
2. Synthesize information across multiple entries if needed
3. Provide clear, concise answers with references to specific entries
4. If no relevant information is found, say so honestly

Format your response in markdown with sections if appropriate.`;

      userPrompt = `Here are the user's learning entries:

${formattedEntries}

User's question: ${query}

Please search through the entries and provide a helpful answer.`;
    } else if (action === 'interview-prep') {
      systemPrompt = `You are a senior technical interviewer and career coach with 15+ years of experience at top tech companies. Your job is to generate realistic, challenging interview questions based on the user's learning entries and provide comprehensive answers they can study.

You MUST respond with ONLY a valid JSON object. No markdown, no code blocks, no extra text - just pure JSON.

Generate 6-8 interview questions with exactly this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "The interview question text",
      "difficulty": "easy",
      "category": "Technical",
      "whyAsked": "Brief explanation of why interviewers ask this",
      "sampleAnswer": "A comprehensive sample answer (2-4 paragraphs)",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
      "followUp": "A potential follow-up question"
    }
  ],
  "studyTips": ["Study tip 1", "Study tip 2", "Study tip 3"],
  "topicsIdentified": ["Topic 1", "Topic 2"]
}

Rules:
- difficulty must be exactly "easy", "medium", or "hard"
- category must be "Technical", "Behavioral", "System Design", or "Problem Solving"
- Generate questions directly relevant to the user's actual learning entries
- Mix difficulty levels (2 easy, 3-4 medium, 2 hard)
- Include both theoretical and practical questions
- Provide detailed, helpful sample answers`;

      userPrompt = `Based on these learning entries, generate interview questions with detailed answers:

${formattedEntries}

${query ? `Focus specifically on: ${query}` : 'Cover all topics from the learning entries.'}

Respond with ONLY the JSON object.`;
    } else if (action === 'insights') {
      systemPrompt = `You are a learning analytics expert. Analyze the user's learning patterns and provide actionable insights to help them learn more effectively.

Provide insights on:
1. Learning patterns and trends
2. Topics that need more attention
3. Knowledge gaps based on what's been learned
4. Suggestions for what to learn next
5. Connections between different topics

Be specific and actionable in your recommendations.`;

      userPrompt = `Here are the user's learning entries:

${formattedEntries}

Please analyze these entries and provide learning insights.`;
    } else {
      throw new Error('Invalid action');
    }

    // For interview-prep, use non-streaming for reliable JSON parsing
    const useStreaming = action !== 'interview-prep';

    console.log('Calling AI gateway, streaming:', useStreaming);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        stream: useStreaming,
      }),
    });

    if (!response.ok) {
      console.error('AI gateway response not ok:', response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error('AI gateway error');
    }

    if (useStreaming) {
      // Return streaming response for search and insights
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    } else {
      // Parse and return JSON for interview-prep
      const data = await response.json();
      console.log('AI response received for interview-prep');
      
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in AI response');
      }

      console.log('Raw content length:', content.length);

      // Try to extract JSON from the response
      let jsonContent = content;
      
      // Remove markdown code blocks if present
      if (jsonContent.includes('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (jsonContent.includes('```')) {
        jsonContent = jsonContent.replace(/```\s*/g, '');
      }
      
      // Trim whitespace
      jsonContent = jsonContent.trim();

      // Try to parse the JSON
      try {
        const parsed = JSON.parse(jsonContent);
        console.log('Successfully parsed JSON with', parsed.questions?.length, 'questions');
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.log('Content that failed to parse:', jsonContent.substring(0, 500));
        
        // Try to extract JSON using regex as fallback
        const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            console.log('Regex extraction successful with', parsed.questions?.length, 'questions');
            return new Response(JSON.stringify(parsed), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } catch (e) {
            console.error('Regex extracted JSON also failed to parse');
          }
        }
        
        throw new Error('Failed to parse AI response as JSON');
      }
    }
  } catch (error) {
    console.error('AI assistant error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
