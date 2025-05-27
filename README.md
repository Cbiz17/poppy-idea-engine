# Poppy Idea Engine

A proof-of-concept AI-powered idea development platform that transforms conversations with Claude AI into organized, actionable insights. Users can chat with AI to develop ideas, then organize them spatially using an intuitive drag-and-drop tile interface.

## Vision

This project serves as both a valuable standalone tool and strategic research for the larger Poppy ecosystem - a personal AI orchestrator that will eventually manage digital life through persistent memory and automated actions.

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **AI Integration**: Claude AI via Anthropic API
- **Authentication**: Supabase Auth with Google OAuth
- **UI Interactions**: DND Kit for drag-and-drop functionality

## Quick Start

1. Clone this repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and configure your environment variables
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

Comprehensive project documentation lives in the `/docs` folder:
- `FOUNDATION.md` - Complete project vision and technical architecture
- `DEVELOPMENT_GUIDE.md` - Step-by-step development instructions
- `DATABASE_SCHEMA.md` - Database design and relationships
- `API_DOCUMENTATION.md` - API endpoints and data contracts

## Contributing

This is currently a private development project. All development happens locally with deployment to staging and production environments managed through GitHub Actions.

## License

Private project - All rights reserved