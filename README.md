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

## Real-Time Data Acquisition (Serial Port)

### Overview

The project includes a Node.js script to capture hydraulic measurements directly from IoT devices via serial port (e.g., ESP32 with sensors).

### Quick Start

1. **Copy the environment template:**

   ```sh
   cp scripts/.env.example scripts/.env
   ```

2. **Edit `scripts/.env` with your configuration:**

   ```env
   SERIAL_PORT=COM3                    # Your COM port (COM3, /dev/ttyUSB0, etc.)
   SERIAL_BAUD=115200                  # Baud rate
   SERIAL_OUTPUT_FILE=data.txt         # Local JSONL file
   SERIAL_SEND_TO_SUPABASE=true        # Enable Supabase sync
   SUPABASE_FUNCTION_URL=https://...   # Your edge function URL
   SUPABASE_ANON_KEY=your_key          # Supabase anonymous key
   ```

3. **Start capturing data:**

   ```sh
   npm run data:serial
   ```

### Features

- **Local logging**: Saves all measurements to JSONL file (one per line)
- **Supabase sync**: Automatically sends data to your backend function
- **Flexible input**: Accepts `flow_rate`/`flow`/`debit`, `pressure`/`pression`, `temperature`/`temp`
- **Error resilient**: Ignores malformed lines, continues on network errors
- **Configurable**: All ports, baud rates, and endpoints via environment variables

### Expected Sensor Format

Your IoT device should transmit JSON per line, e.g.:

```json
{"flow_rate": 42.5, "pressure": 3.2, "temperature": 22.1, "idTroncon": "TR-Z1-042"}
```

Or:

```json
{"flow": 42.5, "pression": 3.2, "temp": 22.1}
```

The script normalizes field names automatically.

### Deployment

Build the project with:

```sh
npm run build
```

The production files are generated in dist/ and can be served by any static hosting provider.
