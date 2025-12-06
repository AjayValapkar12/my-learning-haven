import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    let systemPrompt = '';
    let userPrompt = '';

    if (action === 'smart-search') {
      systemPrompt = `You are an AI assistant for a personal learning journal. Your job is to help users find relevant information from their learning entries and provide insightful answers based on their stored knowledge.

When searching through entries, you should:
1. Find the most relevant entries based on the query
2. Synthesize information across multiple entries if needed
3. Provide clear, concise answers with references to specific entries
4. If no relevant information is found, say so honestly

Format your response in markdown with sections if appropriate.`;

      userPrompt = `Here are the user's learning entries:

${entries.map((e: any, i: number) => `
Entry ${i + 1}: "${e.title}"
Topic: ${e.topic?.name || 'No topic'}
Content: ${e.content || e.summary || 'No content'}
Tags: ${e.tags?.map((t: any) => t.name).join(', ') || 'No tags'}
Status: ${e.status}
---`).join('\n')}

User's question: ${query}

Please search through the entries and provide a helpful answer.`;
    } else if (action === 'interview-prep') {
      systemPrompt = `You are an expert interview coach. Based on the user's learning entries, generate relevant interview questions and provide guidance on how to answer them effectively.

For each question:
1. State the question clearly
2. Explain why this might be asked
3. Provide a suggested answer structure based on the user's knowledge
4. Include tips for delivering a strong response

Generate 5-7 relevant interview questions based on the content.`;

      userPrompt = `Here are the user's learning entries to base interview questions on:

${entries.map((e: any, i: number) => `
Entry ${i + 1}: "${e.title}"
Topic: ${e.topic?.name || 'No topic'}
Content: ${e.content || e.summary || 'No content'}
Tags: ${e.tags?.map((t: any) => t.name).join(', ') || 'No tags'}
---`).join('\n')}

${query ? `Focus area: ${query}` : 'Generate general interview questions based on all topics.'}

Please generate interview questions and preparation guidance.`;
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

${entries.map((e: any, i: number) => `
Entry ${i + 1}: "${e.title}"
Topic: ${e.topic?.name || 'No topic'}
Summary: ${e.summary || 'No summary'}
Status: ${e.status}
Created: ${e.created_at}
Tags: ${e.tags?.map((t: any) => t.name).join(', ') || 'No tags'}
---`).join('\n')}

Please analyze these entries and provide learning insights.`;
    } else {
      throw new Error('Invalid action');
    }

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
        stream: true,
      }),
    });

    if (!response.ok) {
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

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('AI assistant error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
