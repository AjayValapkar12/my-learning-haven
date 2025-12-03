import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Topic } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';

export function useTopics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['topics', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      return data as Topic[];
    },
    enabled: !!user,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; color?: string }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: topic, error } = await supabase
        .from('topics')
        .insert({
          user_id: user.id,
          name: data.name,
          color: data.color || '#8B9B7E',
        })
        .select()
        .single();

      if (error) throw error;
      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('topics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
  });
}
