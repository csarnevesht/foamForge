import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedPattern } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const patternSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "A creative name for the pattern" },
    points: { 
      type: Type.ARRAY,
      description: "A dense ordered list of X,Y coordinates (0-100) forming the continuous cut path.",
      items: {
        type: Type.OBJECT,
        properties: {
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER }
        },
        required: ["x", "y"]
      }
    },
    description: { type: Type.STRING, description: "Short description of the shape and usage." },
    difficulty: { type: Type.STRING, description: "Estimated difficulty: Easy, Medium, or Hard" },
    estimatedCutTime: { type: Type.STRING, description: "Estimated time to cut with hot wire, e.g., '5 mins'" },
  },
  required: ["name", "points", "description", "difficulty", "estimatedCutTime"],
};

export const generatePattern = async (prompt: string): Promise<GeneratedPattern> => {
  try {
    const model = "gemini-3-pro-preview"; 
    const response = await ai.models.generateContent({
      model,
      contents: `You are an expert CNC Hot Wire Foam Cutter path generator.
      
      User Request: Create a cut path for: "${prompt}".

      CRITICAL GEOMETRIC RULES:
      1. COORDINATE SYSTEM: Use Standard Cartesian Coordinates. (0,0) is BOTTOM-LEFT. (100,100) is TOP-RIGHT.
         - Ensure the shape is upright in this coordinate system.
      2. SINGLE CONTINUOUS POLYLINE: The output must be a single ordered array of coordinates. The wire CANNOT lift.
      3. HANDLING TEXT / MULTIPLE SHAPES:
         - If the input is text (e.g., "HELLO") or disjoint shapes, you MUST connect them.
         - Strategy: Draw the first letter, then exit at the bottom-right, draw a connecting line along the bottom (baseline) to the start of the next letter.
         - Do not cross through the middle of the shape if possible.
      4. INTERNAL HOLES (The "Hidden Seam"):
         - To cut a hole (e.g., inside 'A', 'O', 'B'), use the "Bridge" method.
         - Cut from the outer perimeter -> Enter at a vertex -> Cut the hole -> Exit at the same vertex -> Resume outer perimeter.
      5. DENSITY: Use enough points to make curves look smooth.

      ALGORITHM EXAMPLE (Letter 'O'):
      Start at outside bottom-left -> Trace outside to bottom-middle -> Cut IN to inner bottom-middle -> Trace inner circle -> Cut OUT to outer bottom-middle -> Finish tracing outside.

      Fit the shape coordinates roughly within 0-100 range.
      Return the response in the specified JSON schema.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: patternSchema,
        systemInstruction: "You are a specialized G-code generator. Output coordinates where Y=0 is the floor/bottom. Always connect disjoint letters with a baseline segment."
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