import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { LearningEntry, EntryStatus, Tag } from '@/types/learning';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

      if (error) {
        console.error('Error fetching entries:', error);
        throw error;
      }

      // Fetch tags for each entry
      const entriesWithTags = await Promise.all(
        (data || []).map(async (entry) => {
          const { data: tagData } = await supabase
            .from('entry_tags')
            .select('tag_id, tags(*)')
            .eq('entry_id', entry.id);

          return {
            ...entry,
            tags: tagData?.map((t: any) => t.tags).filter(Boolean) || []
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

      if (error) {
        console.error('Error fetching entry:', error);
        throw error;
      }
      if (!data) return null;

      const { data: tagData } = await supabase
        .from('entry_tags')
        .select('tag_id, tags(*)')
        .eq('entry_id', id);

      return {
        ...data,
        tags: tagData?.map((t: any) => t.tags).filter(Boolean) || []
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
      topic_id?: string | null;
      status?: EntryStatus;
      reference_links?: string[];
      tagIds?: string[];
    }) => {
      if (!user) throw new Error('Not authenticated');

      console.log('Creating entry with data:', data);

      const { data: entry, error } = await supabase
        .from('learning_entries')
        .insert({
          user_id: user.id,
          title: data.title,
          content: data.content || null,
          summary: data.summary || null,
          topic_id: data.topic_id || null,
          status: data.status || 'active',
          reference_links: data.reference_links?.length ? data.reference_links : null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating entry:', error);
        throw error;
      }

      console.log('Entry created:', entry);

      if (data.tagIds && data.tagIds.length > 0) {
        const { error: tagError } = await supabase
          .from('entry_tags')
          .insert(data.tagIds.map(tagId => ({
            entry_id: entry.id,
            tag_id: tagId
          })));
        if (tagError) {
          console.error('Error adding tags:', tagError);
        }
      }

      return entry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      toast.error(error.message || 'Failed to create entry');
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
      console.log('Updating entry:', id, data);

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content || null;
      if (data.summary !== undefined) updateData.summary = data.summary || null;
      if (data.topic_id !== undefined) updateData.topic_id = data.topic_id;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.reference_links !== undefined) updateData.reference_links = data.reference_links?.length ? data.reference_links : null;

      const { error } = await supabase
        .from('learning_entries')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating entry:', error);
        throw error;
      }

      if (data.tagIds !== undefined) {
        // Remove existing tags
        await supabase.from('entry_tags').delete().eq('entry_id', id);
        
        // Add new tags
        if (data.tagIds.length > 0) {
          const { error: tagError } = await supabase
            .from('entry_tags')
            .insert(data.tagIds.map(tagId => ({
              entry_id: id,
              tag_id: tagId
            })));
          if (tagError) {
            console.error('Error updating tags:', tagError);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
      queryClient.invalidateQueries({ queryKey: ['learning-entry'] });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update entry');
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting entry:', id);

      const { error } = await supabase
        .from('learning_entries')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting entry:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-entries'] });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete entry');
    },
  });
}
