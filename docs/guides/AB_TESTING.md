# A/B Testing Implementation Guide

## Overview

The Poppy Idea Engine now includes a complete A/B testing system for prompts, allowing data-driven optimization of AI responses.

## Architecture

### Database Tables

- **ab_tests**: Test configurations and metadata
- **user_test_assignments**: User-to-test mappings
- **ab_test_results**: Aggregated performance metrics
- **user_ab_preferences**: User opt-in/out preferences

### Key Functions

- `get_user_test_variant()`: Assigns users to test groups
- `get_prompt_performance_metrics()`: Calculates success metrics
- `get_prompt_daily_metrics()`: Time-series performance data

## How It Works

### 1. User Assignment

When a user interacts with the chat:

1. System checks for active A/B tests
2. If found, assigns user to control or variant group
3. Assignment persists for test duration
4. Tracks impressions in `user_actions` table

### 2. Prompt Selection

```typescript
// In chat routes
const { data: testVariant } = await supabase.rpc('get_user_test_variant', {
  p_user_id: user.id,
  p_test_type: 'prompt_variation',
})

if (testVariant?.length > 0) {
  // Use test variant prompt
} else {
  // Use active prompt
}
```

### 3. Performance Tracking

- Every chat interaction is tracked
- Feedback linked to specific prompt versions
- Metrics aggregated in real-time

## Admin Interface

### Creating A/B Tests

1. Navigate to Admin Panel
2. Click "Activate" on any inactive prompt
3. Choose "Run A/B test first"
4. Configure:
   - Test name and description
   - Traffic split (default 50/50)
   - Success metric (satisfaction or positive rate)
   - Duration and sample size

### Monitoring Tests

- Active tests shown at top of admin panel
- Progress bar shows completion
- Real-time participant count
- Traffic split visualization

## Analytics Integration

The analytics dashboard automatically:

- Shows metrics for active prompts
- Compares test variants
- Calculates statistical significance
- Visualizes trends over time

## Best Practices

### Test Design

- Run tests for at least 7 days
- Aim for 100+ participants per variant
- Test one major change at a time
- Document hypothesis clearly

### Success Metrics

- **Satisfaction Score**: Average 1-5 rating
- **Positive Feedback Rate**: % thumbs up + high ratings
- **Engagement**: Messages per conversation
- **Task Completion**: Ideas saved

### Common Test Ideas

1. **Tone variations**: Formal vs casual
2. **Response length**: Concise vs detailed
3. **Personality**: Encouraging vs neutral
4. **Structure**: Bullet points vs paragraphs

## Implementation Checklist

- [x] Database schema for A/B tests
- [x] User assignment function
- [x] Chat route integration
- [x] Admin UI for test creation
- [x] Test monitoring dashboard
- [x] Analytics integration
- [ ] Automatic winner selection
- [ ] Statistical significance calculation
- [ ] Email notifications for test completion

## Troubleshooting

### Users Not Being Assigned

- Check if test is active: `is_active = true`
- Verify test status: `test_status = 'running'`
- Ensure user is authenticated

### Metrics Not Updating

- Verify `prompt_id` is stored in conversations
- Check feedback is being collected
- Run analytics SQL functions manually

### Console Debugging

Look for these logs:

```
[A/B Testing] User test variant: [...]
[A/B Testing] Using test variant prompt: { testId: '...', group: '...', promptVersion: X }
```

## Future Enhancements

1. **Multi-variate testing**: Test 3+ variants
2. **Segmented tests**: Target specific user groups
3. **Automated optimization**: AI suggests test ideas
4. **Bandit algorithms**: Dynamic traffic allocation
5. **Cross-prompt testing**: Test prompt combinations
