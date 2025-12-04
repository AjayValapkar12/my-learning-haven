-- Fix RLS policies to be PERMISSIVE (default behavior)
-- Drop existing restrictive policies and recreate as permissive

-- Entry Tags
DROP POLICY IF EXISTS "Users can manage their own entry tags" ON public.entry_tags;
CREATE POLICY "Users can manage their own entry tags" ON public.entry_tags
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_entries 
      WHERE id = entry_tags.entry_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.learning_entries 
      WHERE id = entry_tags.entry_id AND user_id = auth.uid()
    )
  );

-- Learning Entries
DROP POLICY IF EXISTS "Users can manage their own entries" ON public.learning_entries;
CREATE POLICY "Users can manage their own entries" ON public.learning_entries
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tags
DROP POLICY IF EXISTS "Users can manage their own tags" ON public.tags;
CREATE POLICY "Users can manage their own tags" ON public.tags
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Topics
DROP POLICY IF EXISTS "Users can manage their own topics" ON public.topics;
CREATE POLICY "Users can manage their own topics" ON public.topics
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Profiles - need separate policies for each operation
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);