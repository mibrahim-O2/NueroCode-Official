-- Track 25-problem challenge pool per topic node per student
CREATE TABLE IF NOT EXISTS public.roadmap_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of 25 problems (12 Easy, 10 Medium, 3 Hard) with test cases
    current_index INT NOT NULL DEFAULT 0,
    solved_indices INT[] NOT NULL DEFAULT '{}',
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'passed', 'failed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_node_challenge UNIQUE (user_id, node_id)
);

-- Enable Row Level Security
ALTER TABLE public.roadmap_challenges ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if present to avoid recreation conflicts
DROP POLICY IF EXISTS "Users can manage their own roadmap challenges" ON public.roadmap_challenges;

-- Allow users full access to manage their own challenge records
CREATE POLICY "Users can manage their own roadmap challenges"
ON public.roadmap_challenges FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Performance index for active session lookups
CREATE INDEX IF NOT EXISTS idx_roadmap_challenges_user_node
ON public.roadmap_challenges(user_id, node_id);
