# Nebula

Nebula is a cinematic AI-assisted memory gallery for ingesting local images,
generating metadata, organizing timelines, detecting duplicates, and sharing
curated gallery views.

## Features

- Local image ingestion through file and folder selection.
- Gemini-powered image categorization and caption generation.
- Client-side fallback processing when the API proxy is unavailable.
- Timeline, category, location, date, and duplicate-aware gallery views.
- Optional Firebase sync and shared gallery routes.

## Prerequisites

- Node.js 20 or newer.
- A Gemini API key for server-side image analysis.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` and add:
   ```bash
   GEMINI_API_KEY="your_gemini_api_key"
   APP_URL="http://localhost:3000"
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`.

## Build

```bash
npm run build
npm run start
```

The production build emits the client bundle and compiled Express server into
`dist/`.
