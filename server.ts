import express from "express";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import dotenv from "dotenv";
import { ISSUE_ANALYSIS_PROMPT, normalizeIssueCategory } from "./src/issueConfig";
import { getApproximateTorontoWard } from "./src/wards";

dotenv.config();

const require = createRequire(import.meta.url);
const COS = require("cos-nodejs-sdk-v5");

const app = express();
const PORT = 3000;
const geocodeCache = new Map<string, unknown>();
const dataRoot = path.join(process.cwd(), "data");
const QIANFAN_BASE_URL = "https://qianfan.baidubce.com/v2";
const QIANFAN_MODEL = "qwen3.5-397b-a17b";
const COS_BUCKET = process.env.TENCENT_COS_BUCKET;
const COS_REGION = process.env.TENCENT_COS_REGION;
const COS_SECRET_ID = process.env.TENCENT_SECRET_ID;
const COS_SECRET_KEY = process.env.TENCENT_SECRET_KEY;
const COS_PUBLIC_BASE_URL = process.env.TENCENT_COS_PUBLIC_BASE_URL?.replace(/\/$/, "");
const isConfiguredValue = (value: string | undefined) =>
  Boolean(value && value.trim() && !value.trim().startsWith("MY_"));
const isCosConfigured =
  isConfiguredValue(COS_BUCKET) &&
  isConfiguredValue(COS_REGION) &&
  isConfiguredValue(COS_SECRET_ID) &&
  isConfiguredValue(COS_SECRET_KEY);
const cosClient = isCosConfigured
  ? new COS({
      SecretId: COS_SECRET_ID,
      SecretKey: COS_SECRET_KEY,
    })
  : null;

const imageMimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const sanitizeUid = (uid: string) => {
  const safeUid = uid.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_").replace(/_+/g, "_");
  return safeUid || "anonymous_user";
};

const sanitizeReportId = (reportId: string) => {
  const safeReportId = reportId.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_").replace(/_+/g, "_");
  return safeReportId || `report_${Date.now()}`;
};

const getReportRoot = (uid: string, reportId: string) => `${sanitizeUid(uid)}/${sanitizeReportId(reportId)}`;

const uploadBufferToCos = async (key: string, body: Buffer | string, contentType: string) => {
  if (!cosClient || !COS_BUCKET || !COS_REGION) {
    throw new Error("Tencent COS is not configured");
  }

  await cosClient.putObject({
    Bucket: COS_BUCKET,
    Region: COS_REGION,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return COS_PUBLIC_BASE_URL
    ? `${COS_PUBLIC_BASE_URL}/${key.split("/").map(encodeURIComponent).join("/")}`
    : `cos://${COS_BUCKET}/${key}`;
};

const parseImageDataUrl = (imageData: string) => {
  const match = imageData.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
};

const getImageDataForAnalysis = async (imageData: string) => {
  if (imageData.startsWith("data:")) {
    return imageData;
  }

  if (!imageData.startsWith("/data/")) {
    return imageData;
  }

  const oldLocalMatch = imageData.match(/^\/data\/([^/]+)\/([^/]+)$/);
  const reportLocalMatch = imageData.match(/^\/data\/([^/]+)\/([^/]+)\/files\/([^/]+)$/);
  const [, uidPart, reportIdPart, reportFilePart] = reportLocalMatch || [];
  const [, oldUidPart, oldFilePart] = oldLocalMatch || [];
  const safeUidPart = uidPart || oldUidPart;
  const filePart = reportFilePart || oldFilePart;

  if (!safeUidPart || !filePart) {
    throw new Error("Invalid stored image URL");
  }

  const safeUid = sanitizeUid(decodeURIComponent(safeUidPart));
  const safeReportId = reportIdPart ? sanitizeReportId(decodeURIComponent(reportIdPart)) : null;
  const fileName = decodeURIComponent(filePart);
  const extension = path.extname(fileName).slice(1).toLowerCase();
  const mimeType = Object.entries(imageMimeToExtension).find(([, ext]) => ext === extension)?.[0];

  if (!mimeType || fileName.includes("/") || fileName.includes("\\")) {
    throw new Error("Unsupported stored image file");
  }

  const storedImagePath = path.resolve(
    dataRoot,
    safeUid,
    ...(safeReportId ? [safeReportId, "files"] : []),
    fileName
  );
  const resolvedDataRoot = path.resolve(dataRoot);
  if (!storedImagePath.startsWith(resolvedDataRoot)) {
    throw new Error("Stored image path escaped data directory");
  }

  const imageBuffer = await fs.readFile(storedImagePath);
  return `data:${mimeType};base64,${imageBuffer.toString("base64")}`;
};

const parseIssueAnalysisJson = (content: string) => {
  const trimmedContent = content.trim();
  const fencedJsonMatch = trimmedContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const jsonText = fencedJsonMatch?.[1] || trimmedContent;

  return JSON.parse(jsonText);
};

// Enable JSON parsing with 10MB limit for base64 photo uploads
app.use(express.json({ limit: "10mb" }));
app.use("/data", express.static(dataRoot));

// API Section
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.post("/api/photos", async (req, res) => {
  const { uid, reportId, imageData } = req.body as { uid?: string; reportId?: string; imageData?: string };

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided" });
  }

  const parsedImage = parseImageDataUrl(imageData);
  if (!parsedImage) {
    return res.status(400).json({ error: "Photo must be a PNG, JPEG, WEBP, or GIF data URL" });
  }

  const safeUid = sanitizeUid(uid || "anonymous_user");
  const safeReportId = sanitizeReportId(reportId || `report_${Date.now()}`);
  const reportRoot = getReportRoot(safeUid, safeReportId);
  const filesRoot = `${reportRoot}/files`;
  const userDataPath = path.join(dataRoot, safeUid, safeReportId, "files");
  const resolvedUserPath = path.resolve(userDataPath);
  const resolvedDataRoot = path.resolve(dataRoot);

  if (!resolvedUserPath.startsWith(resolvedDataRoot)) {
    return res.status(400).json({ error: "Invalid UID path" });
  }

  const extension = imageMimeToExtension[parsedImage.mimeType];
  const fileName = `${safeReportId}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  const cosKey = `${filesRoot}/${fileName}`;
  const filePath = path.join(userDataPath, fileName);

  try {
    let imageUrl: string;
    let storageProvider: "cos" | "local";

    if (isCosConfigured) {
      imageUrl = await uploadBufferToCos(cosKey, parsedImage.buffer, parsedImage.mimeType);
      storageProvider = "cos";
    } else {
      await fs.mkdir(userDataPath, { recursive: true });
      await fs.writeFile(filePath, parsedImage.buffer);
      imageUrl = `/data/${encodeURIComponent(safeUid)}/${encodeURIComponent(safeReportId)}/files/${encodeURIComponent(fileName)}`;
      storageProvider = "local";
    }

    return res.status(201).json({
      uid: safeUid,
      reportId: safeReportId,
      fileName,
      objectKey: cosKey,
      imageUrl,
      storageProvider,
    });
  } catch (error: any) {
    console.error("Photo Storage Error:", error);
    return res.status(500).json({
      error: "Photo could not be saved",
      details: error.message || error,
    });
  }
});

app.post("/api/reports", async (req, res) => {
  const { uid, reportId, report } = req.body as { uid?: string; reportId?: string; report?: unknown };

  if (!report || typeof report !== "object") {
    return res.status(400).json({ error: "Report details are required" });
  }

  const safeUid = sanitizeUid(uid || "anonymous_user");
  const safeReportId = sanitizeReportId(reportId || `report_${Date.now()}`);
  const reportRoot = getReportRoot(safeUid, safeReportId);
  const objectKey = `${reportRoot}/report-details.json`;
  const detailsJson = JSON.stringify(
    {
      uid: safeUid,
      reportId: safeReportId,
      savedAt: new Date().toISOString(),
      report,
    },
    null,
    2
  );

  try {
    let detailsUrl: string;
    let storageProvider: "cos" | "local";

    if (isCosConfigured) {
      detailsUrl = await uploadBufferToCos(objectKey, detailsJson, "application/json");
      storageProvider = "cos";
    } else {
      const reportPath = path.join(dataRoot, safeUid, safeReportId);
      const detailsPath = path.join(reportPath, "report-details.json");
      const resolvedReportPath = path.resolve(reportPath);
      const resolvedDataRoot = path.resolve(dataRoot);

      if (!resolvedReportPath.startsWith(resolvedDataRoot)) {
        return res.status(400).json({ error: "Invalid report path" });
      }

      await fs.mkdir(reportPath, { recursive: true });
      await fs.writeFile(detailsPath, detailsJson, "utf8");
      detailsUrl = `/data/${encodeURIComponent(safeUid)}/${encodeURIComponent(safeReportId)}/report-details.json`;
      storageProvider = "local";
    }

    return res.status(201).json({
      uid: safeUid,
      reportId: safeReportId,
      objectKey,
      detailsUrl,
      storageProvider,
    });
  } catch (error: any) {
    console.error("Report Storage Error:", error);
    return res.status(500).json({
      error: "Report details could not be saved",
      details: error.message || error,
    });
  }
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
        "User-Agent": "CivicSnapLocalDev/0.1 (local-development)",
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

// AI Analyze Endpoint using the Qianfan OpenAI-compatible chat completions API
app.post("/api/analyze-issue", async (req, res) => {
  const { imageData, fallbackType } = req.body;

  if (!imageData) {
    return res.status(400).json({ error: "No image data provided" });
  }

  // Graceful handling until Qianfan credentials are provided.
  if (!process.env.API_KEY || !process.env.APP_ID) {
    console.warn("API_KEY or APP_ID is not configured. Simulating AI analysis.");
    
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
    } else if (fallbackType === "general_upload") {
      simulatedResult = {
        title: "Civic Issue Submitted",
        category: "other",
        description: "The uploaded photo has been attached for civic review. Add location details and any visible issue notes before submitting.",
      };
    }

    // Artificially delay slightly to mimic real AI processing
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return res.json({
      ...simulatedResult,
      isSimulated: true,
      message: "Showing simulated AI analysis. Configure API_KEY and APP_ID to connect live.",
    });
  }

  try {
    const imageDataForAnalysis = await getImageDataForAnalysis(imageData);

    // OpenAI-compatible Qianfan client. Matches deepseek.py base_url and appid header.
    const openai = new OpenAI({
      apiKey: process.env.API_KEY,
      baseURL: QIANFAN_BASE_URL,
      defaultHeaders: {
        appid: process.env.APP_ID,
      },
    });

    const response = await openai.chat.completions.create({
      model: QIANFAN_MODEL,
      messages: [
        {
          role: "system",
          content: ISSUE_ANALYSIS_PROMPT.system,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ISSUE_ANALYSIS_PROMPT.user,
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataForAnalysis,
              },
            },
          ],
        },
      ],
    });

    const resultText = response.choices[0]?.message?.content || "{}";
    const parsedData = parseIssueAnalysisJson(resultText);

    return res.json({
      title: parsedData.title || "Civic Issue Spotted",
      category: normalizeIssueCategory(parsedData.category),
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
    console.log(`CivicSnap server running on http://localhost:${PORT}`);
  });
}

startServer();
