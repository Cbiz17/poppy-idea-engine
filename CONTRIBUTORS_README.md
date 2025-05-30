# Contributor Tracking Implementation

## Overview
This implementation adds contributor tracking to the Poppy Idea Engine, allowing ideas to show who contributed to them through creation, editing, or merging.

## Features Added

### 1. Database Schema
- New `idea_contributors` table to track all contributors
- Contribution types: 'original', 'merge', 'edit', 'suggestion'
- Automatic tracking of the original creator
- Functions to retrieve contributors with profile information

### 2. Visual Indicators
- Contributor avatars shown on idea cards
- Owner marked with a purple border and star badge
- Merge contributors shown with blue borders
- Shows up to 3 contributors with a "+X" indicator for additional ones
- Tooltips show contributor names and contribution type

### 3. Automatic Tracking
- Original creators automatically tracked when ideas are created
- Editors tracked when someone other than the owner edits an idea
- Merge contributors tracked when ideas are merged, including:
  - The owner of the merged idea
  - All existing contributors from the merged idea

## How to Apply the Migration

### Step 1: Apply the Database Migration
Run the migration file in your Supabase dashboard:

```sql
-- Copy and run the contents of:
-- supabase/migrations/20250529_add_idea_contributors.sql
```

This will:
- Create the `idea_contributors` table
- Set up RLS policies
- Create helper functions
- Add existing idea owners as original contributors

### Step 2: Test the Implementation

1. **Check existing ideas**: All your existing ideas should now show the original creator as a contributor

2. **Test merging**: When you merge two ideas:
   - The merged idea's owner will be added as a contributor
   - All contributors from the merged idea will be copied over
   - You can choose to archive, delete, or keep the merged idea

3. **Test editing**: If you have multiple users, when one user edits another's idea, they'll be tracked as an editor

## Visual Guide

### Contributor Display
- **Purple border + star**: Original owner
- **Blue border**: Merge contributor
- **Gray border**: Edit contributor
- **Avatar order**: Owner first, then by contribution date

### Merge Actions
When merging ideas, you now have three options:
1. **Archive** (recommended): Hides the merged idea but keeps it for reference
2. **Delete**: Permanently removes the merged idea
3. **Keep both**: Merges content but keeps both ideas visible

## Future Enhancements

Consider adding:
- Contribution history timeline
- Contributor statistics
- Permission controls for who can edit ideas
- Notification system for contributors
- Export/import with contributor metadata

## Troubleshooting

If contributors aren't showing:
1. Check that the migration was applied successfully
2. Verify the RLS policies are in place
3. Check browser console for any API errors
4. Ensure the `get_idea_contributors_batch` function exists in your database

## Code Changes Summary

1. **Database**: New migration file with contributors table and functions
2. **API**: Updated `/api/ideas/[id]` to track contributors on edits
3. **UI**: Enhanced IdeaCard to display contributors with visual indicators
4. **Ideas Page**: Modified to fetch and include contributor data
5. **Gallery**: Added contributor tracking during merge operations
