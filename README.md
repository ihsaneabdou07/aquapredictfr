# AquaPredict

AquaPredict is a React + TypeScript dashboard for monitoring hydraulic metrics (debit, pressure, temperature) with charts, alerts, and simulation/realtime modes.

## Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Functions

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

```sh
npm install
npm run dev

## Getting Started

```sh
npm install
npm run dev
```

The app runs by default on port 8080.

## Available Scripts

```sh
npm run dev      # Start development server
npm run lint     # Run ESLint
npm run test     # Run unit tests (Vitest)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Project Structure

- src/pages: route-level pages
- src/components: reusable UI and dashboard components
- src/hooks: application hooks and data logic
- src/integrations/supabase: Supabase client and generated types
- supabase/functions/hydraulic-data-receiver: backend endpoint used by the app

## Deployment

Build the project with:

```sh
npm run build
```

The production files are generated in dist/ and can be served by any static hosting provider.
