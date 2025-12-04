import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useTags() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['tags', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching tags:', error);
        throw error;
      }
      return data as Tag[];
    },
    enabled: !!user,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Creating tag:', name);

      const { data: tag, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: name.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tag:', error);
        throw error;
      }
      
      console.log('Tag created:', tag);
      return tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      console.error('Tag creation error:', error);
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting tag:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });
}
