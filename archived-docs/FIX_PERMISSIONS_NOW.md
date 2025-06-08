# Fix Dynamic Prompts Permissions - Action Plan

## The Problem

The "Analyze & Improve" button is failing with "Failed to store improved prompt" because the `dynamic_prompts` table has Row Level Security (RLS) enabled but is missing INSERT and UPDATE policies.

## Quick Fix (Do This First)

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run this SQL:

```sql
-- Add missing policies for dynamic_prompts table
CREATE POLICY "Authenticated users can insert prompts"
ON public.dynamic_prompts
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prompts"
ON public.dynamic_prompts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can read all prompts"
ON public.dynamic_prompts
FOR SELECT
TO authenticated
USING (true);
```

## Testing

After running the SQL above:

1. Go back to your Admin Dashboard
2. Click "Analyze & Improve"
3. It should now work! You'll see:
   - Analysis of your 11 feedback entries
   - A new prompt generated based on the positive feedback patterns
   - The new prompt appearing in your "All Prompt Versions" list

## What Happens Next

The system will:

1. Analyze all 11 thumbs-up feedback entries
2. Extract patterns from what made those responses successful
3. Generate an improved prompt that amplifies those patterns
4. Store it as Version 5 (or next available version)
5. You can then manually activate it or set up an A/B test

## Alternative Fix (If SQL Doesn't Work)

If the SQL approach doesn't work, we have backup options:

1. Temporarily disable RLS on dynamic_prompts table
2. Use service role key for admin operations
3. Create a database function that bypasses RLS

But try the SQL fix first - it should work!