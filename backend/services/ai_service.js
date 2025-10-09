// services/ai_service.js
import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate"; // Local Ollama endpoint
const MODEL = "llama3.1:8b";

/**
 * 🧠 Summarize a single hazard report
 */
export const summarizeHazard = async (hazard) => {
  try {
    const prompt = `
You are a running safety assistant generating brief alerts for joggers.

Write clear and natural sentence that calmly informs the runner about this specific hazard nearby.
Avoid giving advice, giving credibility or suggesting routes. Use plain text with no markdown, symbols, or formatting.

Details:
- Incident: ${hazard.incident_type || hazard.type || "Unknown"}
- Description: ${hazard.description || "No details provided"}
- Location: (${hazard.lat}, ${hazard.lng})
- Trust Score: ${hazard.trust_score || "N/A"}
- Agreement Score: ${hazard.agreement_score || "N/A"}

Output only the alert sentence as plain text.
`;

    const res = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt,
      stream: false,
    });

    return res.data.response?.trim() || "No summary generated.";
  } catch (err) {
    console.error("AI summary error:", err.message);
    return "⚠️ Unable to generate summary.";
  }
};

/**
 * 🌐 Summarize multiple nearby hazards into one area alert
 */
export const summarizeNearbyHazards = async (hazards) => {
  if (!hazards || hazards.length === 0)
    return "No hazards reported nearby.";

  try {
    const combinedText = hazards
      .map(
        (h, i) =>
          `${i + 1}. ${h.incident_type || h.type || "Unknown"} - ${
            h.description || "No details provided"
          } (trust: ${h.trust_score ?? "N/A"}, agreement: ${
            h.agreement_score ?? "N/A"
          })`
      )
      .join("\n");

const prompt = `
You are providing a short safety alert for a jogger currently running in an area with several nearby hazards.

Summarize the overall situation in 2–3 sentences, describing what has been reported in the area.
Avoid giving advice, giving credibility, instructions, or route suggestions. Use plain text with no markdown or special symbols.

Nearby hazard reports:
${combinedText}

Output only the alert text as a single plain paragraph.
`;

    const res = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt,
      stream: false,
    });

    return res.data.response?.trim() || "No summary generated.";
  } catch (err) {
    console.error("AI grouped summary error:", err.message);
    return "⚠️ Unable to generate nearby summary.";
  }
};
