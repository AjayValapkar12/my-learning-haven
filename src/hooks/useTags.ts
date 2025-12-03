import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';

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

      if (error) throw error;
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

      const { data: tag, error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: name.toLowerCase().trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return tag;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}
