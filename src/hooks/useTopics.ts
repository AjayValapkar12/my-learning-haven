import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Topic } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

      if (error) {
        console.error('Error fetching topics:', error);
        throw error;
      }
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

      console.log('Creating topic:', data);

      const { data: topic, error } = await supabase
        .from('topics')
        .insert({
          user_id: user.id,
          name: data.name,
          color: data.color || '#8B9B7E',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating topic:', error);
        throw error;
      }
      
      console.log('Topic created:', topic);
      return topic;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
    onError: (error: any) => {
      console.error('Topic creation error:', error);
      toast.error(error.message || 'Failed to create topic');
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

      if (error) {
        console.error('Error deleting topic:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete topic');
    },
  });
}
