require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key found in .env");
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    try {
        // Unfortunately the listModels method might not be easily accessible in all SDK versions via this object
        // but let's try a simple generation with a known base model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const result = await model.generateContent("Hola");
        console.log("Success with gemini-1.5-flash-latest:", result.response.text());
    } catch (e) {
        console.error("Error with gemini-1.5-flash-latest:", e.message);

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hola");
            console.log("Success with gemini-pro:", result.response.text());
        } catch (e2) {
            console.error("Error with gemini-pro:", e2.message);
        }
    }
}

listModels();
