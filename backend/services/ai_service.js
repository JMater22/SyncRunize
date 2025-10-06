// services/ai_service.js
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate"; // Ollama local endpoint
const MODEL = "llama3.1:8b";

export const summarizeHazard = async (hazard) => {
  try {
    const prompt = `
Summarize this hazard report in simple words for a runner. Be concise:

Type: ${hazard.type}
Description: ${hazard.description}
Location: (${hazard.lat}, ${hazard.lng})
Trust Score: ${hazard.trust_score || "N/A"}
Agreement Score: ${hazard.agreement_score || "N/A"}
`;

    const res = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt,
      stream: false,
    });

    return res.data.response.trim();
  } catch (err) {
    console.error("AI summary error:", err.message);
    return "⚠️ Unable to generate summary.";
  }
};
