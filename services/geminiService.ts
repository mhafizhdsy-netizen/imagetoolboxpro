import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { fileToBase64 } from "../utils/imageUtils";

// Initialize the GoogleGenAI client with the API key from environment variables.
// The API key must be obtained exclusively from process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Handle API errors consistently.
const handleGeminiApiError = (error: any): Error => {
  console.error("Gemini API Error:", error);
  // Extract user-friendly message, if available
  const message = error.message || "An unexpected error occurred with the Gemini API.";
  return new Error(`Gemini API Error: ${message}`);
};

interface MemeCaptionResponse {
  topText: string;
  bottomText: string;
}

export const generateMemeCaption = async ({
  base64Image,
  mimeType,
}: {
  base64Image: string;
  mimeType: string;
}): Promise<MemeCaptionResponse> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { text: "Generate a top text and a bottom text for this meme image. Return the response as a JSON object with 'topText' and 'bottomText' properties." },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topText: { type: Type.STRING },
            bottomText: { type: Type.STRING },
          },
          required: ["topText", "bottomText"],
        },
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as MemeCaptionResponse;
  } catch (error) {
    throw handleGeminiApiError(error);
  }
};

export const generateText = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using 'gemini-2.5-flash' for basic text tasks
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiApiError(error);
  }
};

export const describeHtmlContent = async (htmlContent: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Describe the following HTML content in a concise and clear manner, focusing on its purpose and key elements:\n\n${htmlContent}`,
      config: {
        systemInstruction: "You are an AI assistant that analyzes and describes HTML content concisely.",
      },
    });
    return response.text;
  } catch (error) {
    throw handleGeminiApiError(error);
  }
};

// FIX: Updated generateImageFromDescription to accept optional width and height,
// and to calculate the closest supported aspectRatio for the image generation model.
export const generateImageFromDescription = async (
  description: string,
  width?: number, // Optional width
  height?: number, // Optional height
): Promise<string> => {
  try {
    let aspectRatio: '1:1' | '3:4' | '4:3' | '9:16' | '16:9' | undefined = '1:1'; // Default to 1:1

    if (width && height && width > 0 && height > 0) {
      const ratio = width / height;
      const aspectRatios = [
        { ratio: 16 / 9, value: '16:9' },
        { ratio: 9 / 16, value: '9:16' },
        { ratio: 4 / 3, value: '4:3' },
        { ratio: 3 / 4, value: '3:4' },
        { ratio: 1 / 1, value: '1:1' },
      ];

      // Find the closest aspect ratio
      let minDiff = Infinity;
      let closestRatio = '1:1';

      for (const ar of aspectRatios) {
        const diff = Math.abs(ratio - ar.ratio);
        if (diff < minDiff) {
          minDiff = diff;
          closestRatio = ar.value;
        }
      }
      aspectRatio = closestRatio as typeof aspectRatio;
    }

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001', // Using 'imagen-4.0-generate-001' for high-quality image generation
      prompt: description,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio, // Use the calculated aspect ratio
      },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    throw handleGeminiApiError(error);
  }
};