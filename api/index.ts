import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build-vercel",
        },
      },
    });
  }
  return aiClient;
}

// Check configuration credentials
app.get("/api/config-status", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ hasKey });
});

// Real-time analysis endpoint
app.post("/api/analyze", async (req, res) => {
  try {
    const { base64, mimeType } = req.body;

    if (!base64 || !mimeType) {
      return res.status(400).json({ error: "Missing required fields: base64, mimeType" });
    }

    let ai;
    try {
      ai = getGeminiClient();
    } catch (err: any) {
      return res.status(400).json({
        error: "Gemini API key is not configured.",
        message: err.message,
        needSecretsConfig: true,
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

// Export default app to let Vercel run it as serverless function
export default app;
