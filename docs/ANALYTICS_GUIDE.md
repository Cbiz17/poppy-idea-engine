# Analytics Dashboard Documentation

## Overview

The Analytics Dashboard provides comprehensive insights into prompt performance, user satisfaction, and conversation quality.

## Features

### 1. Key Metrics Display
- **Total Interactions**: Number of messages with feedback
- **Average Satisfaction**: Mean rating (1-5 scale)
- **Positive Feedback Rate**: Percentage of positive responses
- **Average Response Time**: AI response latency

### 2. Time-Based Filtering
- **24 Hours**: Daily performance snapshot
- **7 Days**: Weekly trends (default)
- **30 Days**: Monthly overview
- **All Time**: Historical performance

### 3. Performance Visualization
- **Trend Charts**: Daily satisfaction scores
- **Comparison Tables**: All prompt versions ranked
- **Feedback Themes**: Common tags and patterns
- **Progress Indicators**: Trend direction (up/down/stable)

## Technical Implementation

### API Endpoint
```typescript
// GET /api/analytics/prompts
// Query params: timeRange, promptId

Response: {
  metrics: {
    total_interactions: number,
    positive_count: number,
    negative_count: number,
    avg_satisfaction: number,
    unique_users: number,
    avg_response_time: number
  },
  dailyMetrics: Array<{
    metric_date: string,
    total_interactions: number,
    avg_satisfaction: number,
    positive_rate: number
  }>,
  topTags: Array<{
    tag_name: string,
    tag_count: number
  }>,
  comparison: Array<PromptData>,
  trend: {
    direction: 'up' | 'down' | 'stable',
    percentage: number
  }
}
```

### SQL Functions

#### get_prompt_performance_metrics()
Aggregates performance data for a specific prompt and time range:
- Total interactions
- Positive/negative counts
- Average satisfaction
- Unique users
- Response times

#### get_prompt_daily_metrics()
Returns daily breakdown for charting:
- Interactions per day
- Daily satisfaction average
- Positive feedback rate

#### get_top_feedback_tags()
Extracts most common feedback themes

## Dashboard Components

### PromptAnalyticsDashboard.tsx
Main component that:
1. Fetches data from API
2. Renders metric cards
3. Displays trend charts
4. Shows comparison table

### Integration
Added to PromptsAdmin via tab navigation:
```tsx
<button onClick={() => setActiveTab('analytics')}>
  Analytics & Insights
</button>
```

## Usage Guide

### Viewing Analytics
1. Navigate to Admin Panel
2. Click "Analytics & Insights" tab
3. Select time range filter
4. Review metrics and trends

### Interpreting Metrics

#### Satisfaction Score
- **5.0**: Exceptional performance
- **4.0-4.9**: Good performance
- **3.0-3.9**: Average, needs improvement
- **Below 3.0**: Poor, immediate attention needed

#### Positive Feedback Rate
- **80%+**: Excellent
- **60-80%**: Good
- **40-60%**: Average
- **Below 40%**: Concerning

#### Trends
- **Green/Up**: Improving performance
- **Red/Down**: Declining performance
- **Gray/Stable**: No significant change

## Data Requirements

For accurate analytics:
1. **Feedback Collection**: Users must provide ratings
2. **Prompt Tracking**: Conversations linked to prompts
3. **Time Coverage**: At least 7 days of data
4. **Sample Size**: 50+ interactions minimum

## Limitations

### Current
- Placeholder response times (not measured)
- Feedback tags are hardcoded
- No export functionality
- Basic trend calculation

### Planned Improvements
- Real response time tracking
- Dynamic feedback categorization
- CSV/PDF export
- Advanced statistical analysis
- Cohort analysis
- Funnel metrics

## Troubleshooting

### No Data Showing
1. Check if prompts have `prompt_id` in conversations
2. Verify feedback is being collected
3. Ensure SQL functions are created
4. Check browser console for API errors

### Incorrect Metrics
1. Verify time zone settings
2. Check date range calculations
3. Review SQL function logic
4. Validate feedback data quality

### Performance Issues
1. Add database indexes if needed
2. Limit time range for large datasets
3. Consider caching frequent queries
4. Optimize SQL functions

## Best Practices

### Regular Review
- Check analytics weekly
- Compare prompt versions
- Monitor trend changes
- Act on negative trends quickly

### Data-Driven Decisions
- Test changes with A/B tests
- Base improvements on metrics
- Document what works
- Share insights with team

### Continuous Improvement
- Set performance targets
- Track progress over time
- Celebrate improvements
- Learn from failures