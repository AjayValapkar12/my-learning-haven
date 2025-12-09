import { useState } from 'react';
import { LearningEntry } from '@/types/learning';

interface UseAIAssistantOptions {
  entries: LearningEntry[];
}

interface InterviewResponse {
  questions: Array<{
    id: number;
    question: string;
    difficulty: 'easy' | 'medium' | 'hard';
    category: string;
    whyAsked: string;
    sampleAnswer: string;
    keyPoints: string[];
    followUp: string;
  }>;
  studyTips: string[];
  topicsIdentified: string[];
}

export function useAIAssistant({ entries }: UseAIAssistantOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [interviewData, setInterviewData] = useState<InterviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callAI = async (action: 'smart-search' | 'interview-prep' | 'insights', query?: string) => {
    setIsLoading(true);
    setResponse('');
    setInterviewData(null);
    setError(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action,
          query,
          entries: entries.map(e => ({
            id: e.id,
            title: e.title,
            content: e.content,
            summary: e.summary,
            status: e.status,
            topic: e.topic,
            tags: e.tags,
            created_at: e.created_at,
          })),
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // For interview-prep, we get JSON directly (not streaming)
      if (action === 'interview-prep') {
        const data = await resp.json();
        console.log('Interview prep data received:', data);
        
        if (data.questions && Array.isArray(data.questions)) {
          setInterviewData(data);
        } else {
          throw new Error('Invalid interview data format');
        }
      } else {
        // For other actions, handle streaming SSE
        if (!resp.body) throw new Error('No response body');

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = '';
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                fullResponse += content;
                setResponse(fullResponse);
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An error occurred';
      setError(errorMessage);
      console.error('AI Assistant error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const smartSearch = (query: string) => callAI('smart-search', query);
  const getInterviewPrep = (focusArea?: string) => callAI('interview-prep', focusArea);
  const getInsights = () => callAI('insights');

  const reset = () => {
    setResponse('');
    setInterviewData(null);
    setError(null);
  };

  return {
    isLoading,
    response,
    interviewData,
    error,
    smartSearch,
    getInterviewPrep,
    getInsights,
    reset,
  };
}
