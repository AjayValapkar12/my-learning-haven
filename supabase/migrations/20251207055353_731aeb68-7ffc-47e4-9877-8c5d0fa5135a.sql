-- Create table for favorite interview questions
CREATE TABLE public.favorite_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  category TEXT NOT NULL,
  why_asked TEXT,
  sample_answer TEXT,
  key_points TEXT[],
  follow_up TEXT,
  source_topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorite questions" 
ON public.favorite_questions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own favorite questions" 
ON public.favorite_questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite questions" 
ON public.favorite_questions 
FOR DELETE 
USING (auth.uid() = user_id);