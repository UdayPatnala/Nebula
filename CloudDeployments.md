# Nebula Hosting Operations

This guide covers common deployment paths for the Nebula image gallery.

## GitHub

Repository remote:

```bash
https://github.com/UdayPatnala/Nebula.git
```

To publish local changes:

```bash
git add .
git commit -m "Update Nebula"
git push origin main
```

## Render

Render can run Nebula as a full-stack Node service using the included
`render.yaml` blueprint.

1. Open the Render dashboard.
2. Create a new Blueprint instance.
3. Connect `https://github.com/UdayPatnala/Nebula.git`.
4. Render reads `render.yaml` and uses:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
5. Add the required environment variable:
   - `GEMINI_API_KEY`

## Vercel

Nebula includes `vercel.json` and `api/index.ts` for a serverless API adapter.

1. Import `https://github.com/UdayPatnala/Nebula.git` in Vercel.
2. Add `GEMINI_API_KEY` under Environment Variables.
3. Deploy with the default build settings.

## Netlify

Netlify can host the static client build with SPA routing through
`netlify.toml`.

1. Import `https://github.com/UdayPatnala/Nebula.git` in Netlify.
2. Set the build command to `npm run build`.
3. Set the publish directory to `dist`.
4. Add `GEMINI_API_KEY` only if your deployment also proxies API calls.

## Firebase

Firebase is optional. Use it when you want authenticated users, cloud sync, or
shared gallery persistence.

Create a Firebase project, add the app's Firebase configuration through
environment variables, and verify that your Firestore rules match the intended
sharing model before production use.
