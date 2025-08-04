-- Add email column to existing invites table
ALTER TABLE public.invites 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add index for email column
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);

-- Update RLS policies to include email column
DROP POLICY IF EXISTS "Users can view invites for their household" ON public.invites;
DROP POLICY IF EXISTS "Users can create invites for their household" ON public.invites;
DROP POLICY IF EXISTS "Users can update invites for their household" ON public.invites;
DROP POLICY IF EXISTS "Users can delete invites for their household" ON public.invites;

-- Recreate RLS policies
CREATE POLICY "Users can view invites for their household" ON public.invites
    FOR SELECT USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create invites for their household" ON public.invites
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invites for their household" ON public.invites
    FOR UPDATE USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invites for their household" ON public.invites
    FOR DELETE USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid()
        )
    ); 