import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || "" });

export async function getRecipeSuggestions(inventory: any[]) {
  const inventoryStr = inventory.map(i => `${i.name} (${i.quantity} ${i.unit_type})`).join(", ");
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the following kitchen inventory, suggest 3 recipes I can make. Rank them by how many ingredients I already have.
    Inventory: ${inventoryStr}
    
    If an ingredient is missing but I have something similar (e.g., missing heavy cream but have milk), suggest a substitution.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            score: { type: Type.NUMBER, description: "Percentage of ingredients available (0-100)" },
            missingIngredients: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING }
                },
                required: ["name", "quantity", "unit"]
              } 
            },
            substitutions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  missing: { type: Type.STRING },
                  suggested: { type: Type.STRING },
                  reason: { type: Type.STRING }
                }
              }
            },
            instructions: { type: Type.STRING }
          },
          required: ["name", "score", "missingIngredients", "instructions"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse recipes", e);
    return [];
  }
}
