
import { GoogleGenAI } from "@google/genai";

export const getBusinessInsights = async (inventory: any[], sales: any[]) => {
  try {
    // Initialize GoogleGenAI with process.env.API_KEY directly.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Analyze this textile business data:
      Inventory: ${JSON.stringify(inventory.map(i => ({ name: i.name, stock: i.stock, category: i.category })))}
      Sales: ${JSON.stringify(sales.map(s => ({ name: s.productName, qty: s.quantity, amount: s.totalAmount })))}
      
      Provide 3 concise strategic recommendations for the business owner. 
      Keep it professional and focused on inventory optimization and sales growth.
      Return the response in clear bullet points.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Use .text property to get the generated content string.
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights.";
  }
};
