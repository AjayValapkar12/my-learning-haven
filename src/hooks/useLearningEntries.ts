import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LearningEntry, EntryStatus, Tag } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';

export function useLearningEntries(searchQuery?: string, statusFilter?: EntryStatus | 'all') {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['learning-entries', user?.id, searchQuery, statusFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('learning_entries')
        .select(`
          *,
          topic:topics(*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%`);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch tags for each entry
      const entriesWithTags = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: tagData } = await supabase
            .from('entry_tags')
            .select('tag_id, tags(*)')
            .eq('entry_id', entry.id);

          return {
            ...entry,
            tags: tagData?.map((t: any) => t.tags) || []
          } as LearningEntry;
        })
      );

      return entriesWithTags;
    },
    enabled: !!user,
  });
}

export function useLearningEntry(id: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['learning-entry', id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('learning_entries')
        .select(`
          *,
          topic:topics(*)
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const { data: tagData } = await supabase
        .from('entry_tags')
        .select('tag_id, tags(*)')
        .eq('entry_id', id);

      return {
        ...data,
        tags: tagData?.map((t: any) => t.tags) || []
      } as LearningEntry;
    },
    enabled: !!id && !!user,
  });
}

export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      content?: string;
      summary?: string;
      topic_id?: string;
      status?: EntryStatus;
      reference_links?: string[];
      tagIds?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: entry, error } = await supabase
        .from('learning_entries')
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.content,
          summary: data.summary,
          topic_id: data.topic_id,
          status: data.status || 'active',
          reference_links: data.reference_links,
        })
        .select()
        .single();

      if (error) throw error;

      if (data.tagIds && data.tagIds.length > 0) {
        const { error: tagError } = await supabase
          .from('entry_tags')
          .insert(data.tagIds.map(tagId => ({
            entry_id: entry.id,
            tag_id: tagId
          })));
        if (tagError) throw tagError;
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      title?: string;
      content?: string;
      summary?: string;
      topic_id?: string | null;
      status?: EntryStatus;
      reference_links?: string[];
      tagIds?: string[];
    }) => {
      const { error } = await supabase
        .from('learning_entries')
        .update({
          title: data.title,
          content: data.content,
          summary: data.summary,
          topic_id: data.topic_id,
          status: data.status,
          reference_links: data.reference_links,
        })
        .eq('id', id);

      if (error) throw error;

      if (data.tagIds !== undefined) {
        await supabase.from('entry_tags').delete().eq('entry_id', id);
        
        if (data.tagIds.length > 0) {
          const { error: tagError } = await supabase
            .from('entry_tags')
            .insert(data.tagIds.map(tagId => ({
              entry_id: id,
              tag_id: tagId
            })));
          if (tagError) throw tagError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
      queryClient.invalidateQueries({ queryKey: ['learning-entry'] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('learning_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
    },
  });
}
