-- Track challenge completion per topic node per student
CREATE TABLE IF NOT EXISTS public.roadmap_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES public.roadmap_nodes(id) ON DELETE CASCADE,
    problem_title TEXT NOT NULL,
    problem_description TEXT NOT NULL,
    test_cases JSONB NOT NULL,
    score INT DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'passed', 'failed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, node_id)
);

ALTER TABLE public.roadmap_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own roadmap challenges"
ON public.roadmap_challenges FOR ALL
USING (auth.uid() = user_id);
