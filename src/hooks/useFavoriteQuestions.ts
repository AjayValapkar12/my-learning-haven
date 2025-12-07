import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FavoriteQuestion {
  id: string;
  user_id: string;
  question: string;
  difficulty: string;
  category: string;
  why_asked: string | null;
  sample_answer: string | null;
  key_points: string[] | null;
  follow_up: string | null;
  source_topic: string | null;
  created_at: string;
}

export function useFavoriteQuestions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['favorite-questions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorite_questions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite questions:', error);
        throw error;
      }

      return data as FavoriteQuestion[];
    },
    enabled: !!user?.id,
  });

  const addFavorite = useMutation({
    mutationFn: async (question: {
      question: string;
      difficulty: string;
      category: string;
      whyAsked?: string;
      sampleAnswer?: string;
      keyPoints?: string[];
      followUp?: string;
      sourceTopic?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('favorite_questions')
        .insert({
          user_id: user.id,
          question: question.question,
          difficulty: question.difficulty,
          category: question.category,
          why_asked: question.whyAsked || null,
          sample_answer: question.sampleAnswer || null,
          key_points: question.keyPoints || null,
          follow_up: question.followUp || null,
          source_topic: question.sourceTopic || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding favorite question:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-questions'] });
      toast.success('Question saved to favorites');
    },
    onError: (error) => {
      console.error('Error saving favorite:', error);
      toast.error('Failed to save question');
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (questionId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('favorite_questions')
        .delete()
        .eq('id', questionId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing favorite question:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorite-questions'] });
      toast.success('Question removed from favorites');
    },
    onError: (error) => {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove question');
    },
  });

  const isFavorite = (questionText: string): boolean => {
    return query.data?.some(q => q.question === questionText) ?? false;
  };

  const getFavoriteId = (questionText: string): string | undefined => {
    return query.data?.find(q => q.question === questionText)?.id;
  };

  return {
    favorites: query.data ?? [],
    isLoading: query.isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    getFavoriteId,
  };
}
