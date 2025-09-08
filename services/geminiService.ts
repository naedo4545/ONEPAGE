import { GoogleGenAI } from "@google/genai";
import type { CareerEntry } from "../types";

// Ensure API_KEY is available in the environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

// Helper to extract base64 data and mime type from data URL
const dataUrlToParts = (dataUrl: string): { mimeType: string; data: string } | null => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) return null;
    return { mimeType: match[1], data: match[2] };
};


export const generateBio = async (name: string, title: string, company: string, careerHistory: CareerEntry[]): Promise<string> => {
  if (!name.trim() || !title.trim() || !company.trim()) {
    return "Please fill in your Name, Title, and Company to generate a bio.";
  }
  
  const careerHistoryString = careerHistory.length > 0
    ? ` Their career includes: ${careerHistory.map(j => `${j.title} at ${j.company}`).join(', ')}.`
    : '';

  const prompt = `Write a professional and concise one-sentence bio for a digital business card. The person is ${name}, a ${title} at ${company}.${careerHistoryString} Focus on their key skills and experience. Keep it under 150 characters.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating bio with Gemini API:", error);
    return "Sorry, we couldn't generate a bio at this time. Please try again later.";
  }
};

export const generateImage = async (prompt: string, aspectRatio: "16:9" | "1:1" | "9:16" = "16:9"): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio,
            },
        });

        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (error) {
        console.error("Error generating image with Gemini API:", error);
        throw new Error("Failed to generate image.");
    }
};

export const startVideoGeneration = async (prompt: string) => {
    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting video generation with Gemini API:", error);
        throw new Error("Failed to start video generation.");
    }
};

export const startVideoGenerationWithImage = async (prompt: string, imageDataUrl: string) => {
    const imageParts = dataUrlToParts(imageDataUrl);
    if (!imageParts) {
        throw new Error("Invalid image data URL format.");
    }

    try {
        const operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            image: {
                imageBytes: imageParts.data,
                mimeType: imageParts.mimeType,
            },
            config: {
                numberOfVideos: 1
            }
        });
        return operation;
    } catch (error) {
        console.error("Error starting image-to-video generation with Gemini API:", error);
        throw new Error("Failed to start image-to-video generation.");
    }
};


export const checkVideoGenerationStatus = async (operation: any) => {
    try {
        const updatedOperation = await ai.operations.getVideosOperation({ operation: operation });
        return updatedOperation;
    } catch (error) {
        console.error("Error checking video generation status:", error);
        throw new Error("Failed to check video generation status.");
    }
};

export const fetchVideo = async (downloadLink: string): Promise<string> => {
    try {
        const response = await fetch(`${downloadLink}&key=${apiKey}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch video: ${response.statusText}. Details: ${errorText}`);
        }
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error fetching video:", error);
        throw new Error("Failed to fetch video.");
    }
};