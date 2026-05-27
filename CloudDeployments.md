# 🌌 NEBULA Launch Protocol & Hosting Operations

Welcome, Commander. This file provides precise structural directions to compile, link, and deploy your custom **Nebula Neural Memory Orchestrator** to premier free hosting platforms (**Render**, **Vercel**, **Netlify**) and optionally integrate with a synced **Firebase** cloud database!

## 🐙 1. GitHub Integration

Your project is optimized to synchronize seamlessly with your personal repository:
🔗 **GitHub Remote**: `https://github.com/UdayPatnala/Nebula.git`

To push updates directly from your machine:
```bash
git init
git remote add origin https://github.com/UdayPatnala/Nebula.git
git branch -M main
git add .
git commit -m "feat: cosmic dual-mode ETL orchestrator release"
git push -u origin main
```

---

## ⚡ 2. Render Deployment (Full-stack Server Mode)

Render is excellent for running full-stack applications with active background pipelines. We have included a **custom `render.yaml` Blueprint specification** in the directory root for effortless deployment.

### Automated Setup via render.yaml
1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Go to **Blueprints** -> click **New Blueprint Instance**.
3. Connect your repository `https://github.com/UdayPatnala/Nebula.git`.
4. Render will read `/render.yaml` and automatically configure:
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start` (which fires up our optimized compiled express entrypoint `node dist/server.cjs`)
5. In the env section, supply your:
   - `GEMINI_API_KEY`: *(Available in google AI studio settings)*

### Manual App Setup (Without Blueprint)
If you prefer configuring a manual Web Service on Render:
- Create a **Web Service**.
- Select Node runtime.
- Build command: `npm install && npm run build`
- Start command: `node dist/server.cjs`

---

## 🎨 3. Vercel Deployment (Full-stack Serverless Proxy)

Vercel is the premier platform for hosting responsive frontends combined with serverless backend APIs.
We have written a special `/vercel.json` and a serverless API adapter inside `/api/index.ts`.

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New** -> **Project** -> Import `https://github.com/UdayPatnala/Nebula.git`.
3. Under Environment Variables, add:
   - Key: `GEMINI_API_KEY`
   - Value: *(Your Gemini key)*
4. Leave Build and Output Settings as default.
5. Click **Deploy**. Vercel will bundle the SPA assets and serve the server-side image categorizer via microsecond-fast AWS Lambda routes!

---

## 🌐 4. Netlify Deployment (High-Performance Static Edge)

Netlify is the fastest, lowest-latency host for serving client-side SPAs.
We have written a special `/netlify.toml` file to direct all dynamic page requests to the single-page entry.

1. Open your [Netlify Dashboard](https://app.netlify.com).
2. Click **Import from Git** and link `https://github.com/UdayPatnala/Nebula.git`.
3. Configure the build parameters:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Deploy! Your app will utilize our **Zero-Config Client-Side Fallback Engine**, gracefully compiling captions and using high-contrast local color palettes directly in the browser if no server proxy is ready!

---

##  🔥 5. Optional Cloud Firebase Integration

If you want to sync your local memories with real-time cloud data, you can connect to Firebase Firestore!

### Step A: Provision Firebase
Run the AI Studio Firebase tool or set up a client-side database. 

### Step B: Core Firebase Client Hook Code (Template)
Create a file `/src/lib/firebase.ts`:
```typescript
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase securely
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Save structured metadata cloud-side
export async function syncMemoryToCloud(imageMetadata: any) {
  try {
    const docRef = await addDoc(collection(db, "nebula_memories"), {
      ...imageMetadata,
      syncedAt: new Date().toISOString()
    });
    console.log("Memory secure in cloud storage! Reference:", docRef.id);
  } catch (e) {
    console.error("Cloud synchronization failure:", e);
  }
}
```
You can import `syncMemoryToCloud` in your ingest loops to back up your IndexedDB memories to the cloud!
