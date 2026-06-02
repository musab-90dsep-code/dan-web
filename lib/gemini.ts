import { GoogleGenAI } from "@google/genai";

// Shared GoogleGenAI client on the server side
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'transparent-charity-platform',
    }
  }
});
