# Claude Preferences for This Project

## CRITICAL: GitHub & Deployment Workflow

### GitHub Access
- **Repository**: `Cbiz17/poppy-idea-engine` (NOT cbikis/idea-engine)
- **Owner**: Cbiz17 (NOT cbikis)
- **Note**: GitHub token will be provided in chat when needed

### Deployment Workflow - NEVER TEST LOCALLY
1. **ALWAYS create a new branch** for ANY changes
2. **Push to branch** → Vercel creates preview deployment automatically
3. **Test in Vercel preview URL** (format: `poppy-idea-engine-[branch-name]-cbiz17.vercel.app`)
4. **Only merge to main** AFTER testing passes in preview
5. **Production URL**: `poppy-idea-engine.vercel.app` (main branch only)

### Branch Strategy
- **NEVER commit directly to main branch**
- Create descriptive branch names: `fix/bug-name`, `feature/feature-name`, `update/what-updating`
- Wait for preview deployment before creating PR
- Get approval before merging to main

## Project-Specific Context

### Database (Supabase)
- **Check actual schema** - don't assume column names
- Common tables: `ideas`, `profiles`, `conversations`, `conversation_messages`
- Branching columns exist: `branch_note`, `is_branch`, `branched_from_id`
- NO `metadata` column in ideas table

### Common Pitfalls to Avoid
- Don't assume database columns - check the schema
- Don't merge PRs immediately - wait for testing
- Don't test on local machine - use Vercel previews only
- Don't forget to ask for GitHub token when accessing repos

## Code Generation Preferences

**IMPORTANT**: For this project, avoid using artifacts unless specifically requested.

Instead:
1. **For existing files**: Use `edit_file` to show diffs
2. **For new files**: Use `write_file` to create them directly
3. **For code snippets**: Use markdown code blocks that can be copied
4. **For debugging**: Use console.log and direct code edits

Only use artifacts when:
- Explicitly asked for an artifact
- Creating visual components that need preview (HTML/React with UI)
- Creating long documents for review

## Workflow Preferences
- Keep changes focused and surgical
- Don't break working functionality
- Add debugging before making big changes
- Test incrementally in Vercel previews
- Create PRs with clear descriptions of changes and testing instructions

## Communication Style
- Be direct and concise
- Explain changes simply
- Ask before making major architectural changes
- Always mention the preview URL when pushing changes
- Remind about testing in preview before merging
