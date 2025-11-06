// services/ai_service.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini"; // GPT-4 Mini model

/**
 * 🧠 Summarize a single hazard report using GPT-4 Mini
 */
export const summarizeHazard = async (hazard) => {
  try {
    if (!OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not configured. Skipping AI summary.");
      return "Hazard reported in this location.";
    }

    const prompt = `You are a running safety assistant generating brief alerts for joggers.

Write a clear and natural sentence that calmly informs the runner about this specific hazard nearby.
Avoid giving advice, giving credibility or suggesting routes. Use plain text with no markdown, symbols, or formatting.

Details:
- Incident: ${hazard.incident_type || hazard.type || "Unknown"}
- Description: ${hazard.description || "No details provided"}
- Location: (${hazard.lat}, ${hazard.lng})
- Trust Score: ${hazard.trust_score || "N/A"}
- Agreement Score: ${hazard.agreement_score || "N/A"}

Output only the alert sentence as plain text.`;

    const res = await axios.post(
      OPENAI_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return res.data.choices[0]?.message?.content?.trim() || "Hazard reported in this location.";
  } catch (err) {
    console.error("AI summary error:", err.response?.data || err.message);
    return "Hazard reported in this location.";
  }
};

/**
 * 🌐 Summarize multiple nearby hazards into one area alert using GPT-4 Mini
 */
export const summarizeNearbyHazards = async (hazards) => {
  if (!hazards || hazards.length === 0)
    return "No hazards reported nearby.";

  try {
    if (!OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not configured. Skipping AI summary.");
      return `${hazards.length} hazard(s) reported in this area.`;
    }

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

    const prompt = `You are providing a short safety alert for a jogger currently running in an area with several nearby hazards.

Summarize the overall situation in 2–3 sentences, describing what has been reported in the area.
Avoid giving advice, giving credibility, instructions, or route suggestions. Use plain text with no markdown or special symbols.

Nearby hazard reports:
${combinedText}

Output only the alert text as a single plain paragraph.`;

    const res = await axios.post(
      OPENAI_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    return res.data.choices[0]?.message?.content?.trim() || `${hazards.length} hazard(s) reported in this area.`;
  } catch (err) {
    console.error("AI grouped summary error:", err.response?.data || err.message);
    return `${hazards.length} hazard(s) reported in this area.`;
  }
};

/**
 * 🛣️ Generate AI-powered safety warnings for a route using GPT-4 Mini
 */
export const generateRouteSafetyWarnings = async (safetyAnalysis) => {
  try {
    if (!OPENAI_API_KEY) {
      console.warn("⚠️ OPENAI_API_KEY not configured. Returning default warnings.");
      return safetyAnalysis.warnings; // Return original warnings if no API key
    }

    const { warnings, stats } = safetyAnalysis;

    if (!warnings || warnings.length === 0) {
      return [];
    }

    // Prepare context for GPT
    const warningsText = warnings
      .map((w, i) => `${i + 1}. [${w.severity.toUpperCase()}] ${w.message} - ${w.advice}`)
      .join("\n");

    const statsText = `
Total Distance: ${stats.total_distance_km?.toFixed(2)} km
Sidewalk Coverage: ${(stats.sidewalk_coverage * 100)?.toFixed(1)}%
Has Critical Warnings: ${stats.has_critical_warnings ? "Yes" : "No"}`;

    const prompt = `You are a running safety assistant analyzing a route for a jogger.

Based on the route analysis below, generate 1-3 concise, actionable safety warnings for the runner. Each warning should be a single sentence that is clear, direct, and helpful.

Rules:
- Consolidate similar warnings into one (e.g., don't repeat "wear reflective clothing" multiple times)
- Prioritize critical warnings first
- Use natural, conversational language
- No markdown, bullets, or special formatting
- Each warning should be a complete sentence
- Separate multiple warnings with " | " (pipe symbol)

Route Analysis:
${warningsText}

Route Stats:
${statsText}

Output format: Warning 1 | Warning 2 | Warning 3
If only one warning is needed, output just that warning without the pipe symbol.`;

    const res = await axios.post(
      OPENAI_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    const aiResponse = res.data.choices[0]?.message?.content?.trim();

    if (!aiResponse) {
      return safetyAnalysis.warnings; // Fallback to original
    }

    // Split by pipe and create warning objects
    const aiWarnings = aiResponse
      .split("|")
      .map(text => text.trim())
      .filter(text => text.length > 0)
      .map((text, index) => ({
        type: "ai_generated",
        severity: warnings[0]?.severity || "info", // Use highest severity from original
        message: text,
        advice: "" // AI already includes advice in the message
      }));

    return aiWarnings.length > 0 ? aiWarnings : safetyAnalysis.warnings;

  } catch (err) {
    console.error("AI route safety analysis error:", err.response?.data || err.message);
    return safetyAnalysis.warnings; // Fallback to original warnings on error
  }
};
