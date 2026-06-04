import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import { getApproximateTorontoWard } from "./src/wards";

dotenv.config();

const app = express();
const PORT = 3000;
const geocodeCache = new Map<string, unknown>();

// Enable JSON parsing with 10MB limit for base64 photo uploads
app.use(express.json({ limit: "10mb" }));

// API Section
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get("/api/geocode", async (req, res) => {
  const rawAddress = typeof req.query.address === "string" ? req.query.address.trim() : "";

  if (!rawAddress) {
    return res.status(400).json({ error: "Address is required" });
  }

  const cacheKey = rawAddress.toLowerCase();
  const cachedResult = geocodeCache.get(cacheKey);
  if (cachedResult) {
    return res.json(cachedResult);
  }

  try {
    const query = /toronto|ontario|canada/i.test(rawAddress)
      ? rawAddress
      : `${rawAddress}, Toronto, Ontario, Canada`;
    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
      addressdetails: "1",
      countrycodes: "ca",
      bounded: "1",
      viewbox: "-79.6393,43.8555,-79.1153,43.5810",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "CivicPulseLocalDev/0.1 (local-development)",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: "Geocoding provider returned an error" });
    }

    const results = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    const match = results[0];

    if (!match?.lat || !match?.lon) {
      return res.status(404).json({ error: "No Toronto geocode match found" });
    }

    const geocodedResult = {
      address: rawAddress,
      displayName: match.display_name || rawAddress,
      lat: Number(match.lat),
      lng: Number(match.lon),
      ward: getApproximateTorontoWard(Number(match.lat), Number(match.lon)).label,
      source: "nominatim",
    };

    geocodeCache.set(cacheKey, geocodedResult);
    return res.json(geocodedResult);
  } catch (error: any) {
    console.error("Geocoding Error:", error);
    return res.status(500).json({
      error: "Geocoding failed",
      details: error.message || error,
    });
  }
});

// AI Analyze Endpoint using OpenAI Responses API
app.post("/api/analyze-issue", async (req, res) => {
  const { imageData, fallbackType } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided" });
  }

  // Graceful handling if OpenAI API Key is missing or default
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MY_OPENAI_API_KEY") {
    console.warn("OPENAI_API_KEY is not configured or placeholder. Simulating AI analysis.");
    
    // Polished simulated fallback based on fallbackType or default
    let simulatedResult = {
      title: "Pothole on Elm Street",
      category: "potholes",
      description: "A wide, jagged pothole developing in the center lane of Elm St., obstructing traffic lane.",
    };

    if (fallbackType === "graffiti") {
      simulatedResult = {
        title: "Graffiti Mural on Brick Wall",
        category: "graffiti",
        description: "Fresh spray-paint graffiti covering approximately 10 sq ft on the side brick wall of Queen St. business.",
      };
    } else if (fallbackType === "streetlight") {
      simulatedResult = {
        title: "Completely Dark Streetlight",
        category: "streetlights",
        description: "The street lamppost outside 142 Elm St has a broken or burnt bulb and fails to illuminate the sidewalk.",
      };
    } else if (fallbackType === "pothole_king") {
      simulatedResult = {
        title: "Deep Cracking Pothole",
        category: "potholes",
        description: "Extremely deep, expanding pothole crumbling at the edges in the middle lane of King Street.",
      };
    }

    // Artificially delay slightly to mimic real AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return res.json({
      ...simulatedResult,
      isSimulated: true,
      message: "Showing simulated AI analysis. Configure OPENAI_API_KEY to connect live.",
    });
  }

  try {
    // Lazy initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Analyze this image of a municipal civic issue. Classify it into one of three categories: 'potholes', 'graffiti', or 'streetlights', and write a concise, professional title (e.g. 'Deep pothole forming', 'Graffiti on brick facade') and a 1-2 sentence description explaining the issue.",
            },
            {
              type: "input_image",
              image_url: imageData,
              detail: "auto",
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "municipal_issue_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: {
                type: "string",
                description: "A short, professional title summarizing the issue in 4-7 words.",
              },
              category: {
                type: "string",
                enum: ["potholes", "graffiti", "streetlights"],
                description: "The municipal issue category.",
              },
              description: {
                type: "string",
                description: "A precise, 1-2 sentence description detailing what is visible and why it is a hazard or nuisance.",
              },
            },
            required: ["title", "category", "description"],
          },
        },
      },
    });

    const resultText = response.output_text?.trim() || "{}";
    const parsedData = JSON.parse(resultText);

    return res.json({
      title: parsedData.title || "Civic Issue Spotted",
      category: parsedData.category || "potholes",
      description: parsedData.description || "Spotted issue needing municipal attention.",
      isSimulated: false,
    });
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    return res.status(500).json({
      error: "AI analysis failed",
      details: error.message || error,
    });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded as custom middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from dist directory.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CivicPulse server running on http://localhost:${PORT}`);
  });
}

startServer();
