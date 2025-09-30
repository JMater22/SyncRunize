// services/ai_service.js
// Handles AI tasks (summarization, semantic similarity, etc.)

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

export const summarizeText = async (text) => {
  try {
    // Stub call — requires valid OpenAI API key in .env
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: `Summarize this: ${text}` }],
    });
    return completion.choices[0].message.content;
  } catch (err) {
    console.error("AI service error:", err.message);
    return "AI summary unavailable (stub).";
  }
};
