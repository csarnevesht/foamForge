import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedPattern } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const patternSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name for the pattern" },
    svgPath: { type: Type.STRING, description: "A valid SVG 'd' path attribute string that draws the requested shape. It should be centered in a 100x100 viewBox." },
    description: { type: Type.STRING, description: "Short description of the shape and usage." },
    difficulty: { type: Type.STRING, description: "Estimated difficulty: Easy, Medium, or Hard" },
    estimatedCutTime: { type: Type.STRING, description: "Estimated time to cut with hot wire, e.g., '5 mins'" },
  },
  required: ["name", "svgPath", "description", "difficulty", "estimatedCutTime"],
};

export const generatePattern = async (prompt: string): Promise<GeneratedPattern> => {
  try {
    const model = "gemini-2.5-flash"; 
    const response = await ai.models.generateContent({
      model,
      contents: `Create a continuous single-line SVG path (suitable for hot wire foam cutting) for the following request: ${prompt}. 
      Ensure the path is closed if it's a solid shape. The path coordinates should fit roughly within a 0,0 to 100,100 coordinate space.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: patternSchema,
        systemInstruction: "You are an expert CNC and manual hot wire foam cutter. You generate vector paths optimized for continuous wire cutting."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedPattern;
  } catch (error) {
    console.error("Pattern generation failed:", error);
    throw error;
  }
};

export const getChatResponseStream = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are 'Volt', a helpful AI assistant for foam cutting enthusiasts. You know about XPS, EPS, EPP foams, hot wire cutters, CNC machines, and manual crafting techniques. Keep answers concise, practical, and safety-focused (remind about fumes).",
        },
        history: history
    });

    return chat.sendMessageStream({ message: newMessage });
};