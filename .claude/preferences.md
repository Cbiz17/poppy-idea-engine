# Claude Preferences for This Project

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
- Test incrementally

## Communication Style
- Be direct and concise
- Explain changes simply
- Ask before making major architectural changes
