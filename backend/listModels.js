require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There is no listModels on the class directly in newer SDKs, so let's hit the REST API directly
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("AVAILABLE MODELS:", data.models.map(m => m.name).join(", "));
  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

listModels();
