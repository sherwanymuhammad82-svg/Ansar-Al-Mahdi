import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Fetch the image
    const response = await fetch("https://drive.google.com/thumbnail?id=1fLXj0dNc_fRNZVAXdfgWm2XoodBFhIXO&sz=w2000");
    const buffer = await response.arrayBuffer();
    const base64EncodeString = Buffer.from(buffer).toString('base64');
    
    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64EncodeString,
      },
    };
    const textPart = {
      text: "Extract all the text from this image. Preserve the exact wording and formatting. If there is Arabic and Kurdish text, extract both.",
    };
    
    const aiResponse = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts: [imagePart, textPart] },
    });
    
    console.log("EXTRACTED_TEXT_START");
    console.log(aiResponse.text);
    console.log("EXTRACTED_TEXT_END");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
