import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { GoogleGenAI } from "@google/genai";

// Simple in-memory rate limiting to prevent spamming
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

export const POST = async (
  request: NextRequest,
  { params }: { params?: Promise<{ userId?: string }> },
) => {
  try {
    // 1. Rate Limiting Check (by IP)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const userRate = rateLimitMap.get(ip);

    if (userRate) {
      if (now - userRate.lastReset > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(ip, { count: 1, lastReset: now });
      } else {
        if (userRate.count >= MAX_REQUESTS_PER_WINDOW) {
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            { status: 429 },
          );
        }
        userRate.count++;
      }
    } else {
      rateLimitMap.set(ip, { count: 1, lastReset: now });
    }

    const { documents } = await request.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return badRequest({ errors: "Documents array is required" });
    }

    const apiKey =
      process.env.GEMINI_API_KEY_PRODUCTION ||
      process.env.GEMINI_API_KEY_STAGING;

    if (!apiKey) {
      console.error("Gemini API key is not configured.");
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 },
      );
    }

    const inlineDataParts = documents.map((doc: any) => {
      // doc.base64 might have data:image/png;base64, prefix. We need to strip it.
      let base64Data = doc.base64;
      let mimeType = doc.type || "image/jpeg";

      if (base64Data.includes("base64,")) {
        const parts = base64Data.split("base64,");
        mimeType = parts[0].replace("data:", "").replace(";", "");
        base64Data = parts[1];
      }

      return {
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      };
    });

    const prompt = `
    You are an expert OCR and data extraction AI. 
    Analyze the provided document(s) (Driver's License and/or EIN Letter/Bank Statements).
    Extract the following information and return it strictly as a JSON object matching this structure. 
    If a field is not found or cannot be determined, leave it as an empty string "" or null.
    Do NOT return markdown formatting like \`\`\`json. Just return the raw JSON object.

    {
      "personal": {
        "firstName": "string",
        "lastName": "string",
        "addressStreet": "string",
        "addressCity": "string",
        "addressState": "string",
        "addressPostal": "string",
        "driverLicenseNumber": "string",
        "driverLicenseState": "string",
        "dateOfBirth": "YYYY-MM-DD"
      },
      "business": {
        "businessName": "string",
        "employerIdentificationNumber": "string",
        "businessStreetAddress": "string",
        "businessCityAddress": "string",
        "businessStateAddress": "string",
        "businessPostalAddress": "string"
      }
    }
    `;

    const ai = new GoogleGenAI({
      apiKey: apiKey,
    });

    const model = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite-preview";

    const contents = [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
          ...inlineDataParts,
        ],
      },
    ];

    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: "application/json",
      },
    });

    const textResponse = result.text || "{}";

    let extractedData = {};
    try {
      extractedData = JSON.parse(textResponse);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", textResponse);
      extractedData = {};
    }

    return NextResponse.json({ data: extractedData }, { status: 200 });
  } catch (error: any) {
    console.error("OCR Extraction Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
};
