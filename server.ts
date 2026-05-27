/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

let aiClient: GoogleGenAI | null = null;

// Lazy initialization of the Gemini SDK client
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it in the Secrets panel in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API to check credentials status
  app.get("/api/config-status", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY;
    res.json({ hasKey });
  });

  // API route for real-time image intelligence analysis using Gemini 3.5 Flash
  app.post("/api/analyze", async (req, res) => {
    try {
      const { base64, mimeType } = req.body;

      if (!base64 || !mimeType) {
        return res.status(400).json({ error: "Missing required fields: base64, mimeType" });
      }

      // Check key state before trying to call Google Gen AI
      let ai;
      try {
        ai = getGeminiClient();
      } catch (err: any) {
        return res.status(400).json({
          error: "Gemini API key is not configured.",
          message: err.message,
          needSecretsConfig: true
        });
      }

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64,
        },
      };

      const promptText = `Analyze this image and provide metadata in the requested JSON structure. Describe the main subject, approximate the time of day, estimate the number of humans, specify the prominent background setting or location in 1-2 words, and pick a custom hex color palette that matches the mood of the image.`;

      const textPart = {
        text: promptText,
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: {
                type: Type.STRING,
                description: "One-word general category, e.g. Nature, Portrait, Food, Travel, Cityscape, Document, Technology, Art, Indoor",
              },
              timeOfDay: {
                type: Type.STRING,
                description: "Estimated time of day (Morning, Afternoon, Golden Hour, Evening, Night)",
              },
              caption: {
                type: Type.STRING,
                description: "A gorgeous, cinematic 4-8 word caption or poetic expression for the image.",
              },
              peopleCount: {
                type: Type.INTEGER,
                description: "Number of clearly visible humans in the shot (return 0 if none).",
              },
              backgroundLocation: {
                type: Type.STRING,
                description: "A single primary background location, e.g. Mountains, Ocean, Kitchen, CoffeeShop, Street, Forest, Office",
              },
              colorPalette: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: "Array of exactly 3 beautiful, high-contrast theme-friendly hex color codes that match this image's mood.",
              },
            },
            required: ["category", "timeOfDay", "caption", "peopleCount", "backgroundLocation", "colorPalette"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No metadata response from Gemini API.");
      }

      const parsedData = JSON.parse(responseText.trim());
      res.json(parsedData);
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(500).json({
        error: "Failed to recognize and categorize image metadata",
        details: error.message || error,
      });
    }
  });

  // Vite integration middleware for dev environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NEBULA SERVER] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
