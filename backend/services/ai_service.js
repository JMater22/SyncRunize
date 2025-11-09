import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

const callOpenAI = async (prompt, options = {}) => {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const payload = {
    model: MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 200,
  };

  const response = await axios.post(OPENAI_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
  });

  return response.data.choices[0]?.message?.content?.trim() ?? null;
};

export const summarizeHazard = async (hazard) => {
  try {
    const prompt = `You are a running safety assistant generating brief alerts for joggers.

Write a clear sentence that calmly informs the runner about this specific hazard nearby.
Avoid advice or instructions. Use plain text with no markdown or symbols.

Details:
- Incident: ${hazard.incident_type || hazard.type || "Unknown"}
- Description: ${hazard.description || "No details provided"}
- Location: (${hazard.lat}, ${hazard.lng})
- Trust Score: ${hazard.trust_score ?? "N/A"}
- Agreement Score: ${hazard.agreement_score ?? "N/A"}

Only output the alert sentence.`;

    const summary = await callOpenAI(prompt, { maxTokens: 120 });
    return summary || "Hazard reported in this location.";
  } catch (error) {
    console.error("AI summary error:", error.response?.data || error.message);
    return "Hazard reported in this location.";
  }
};

export const summarizeTrafficAlert = async (traffic) => {
  try {
    const prompt = `You are a running safety assistant. Write one short sentence to warn a jogger about nearby traffic conditions.

Details:
- Condition: ${traffic.condition || traffic.incident_type || "Traffic alert"}
- Description: ${traffic.description || "No details provided"}
- Location: (${traffic.lat}, ${traffic.lng})
- Severity: ${traffic.severity || traffic.severity_weight || "unknown"}

Rules:
- Under 20 words.
- Plain English, no emojis, markdown, or instructions.
- Example tone: "Heavy traffic near Elm Street."`;

    const summary = await callOpenAI(prompt, { temperature: 0.6, maxTokens: 80 });
    return summary || "Traffic disruption reported nearby.";
  } catch (error) {
    console.error("AI traffic summary error:", error.response?.data || error.message);
    return "Traffic disruption reported nearby.";
  }
};

export const summarizeNearbyHazards = async (hazards) => {
  if (!hazards || hazards.length === 0) {
    return "No hazards reported nearby.";
  }

  try {
    const combined = hazards
      .map(
        (h, index) =>
          `${index + 1}. ${h.incident_type || h.type || "Unknown"} - ${h.description || "No details"} (trust: ${
            h.trust_score ?? "N/A"
          }, agreement: ${h.agreement_score ?? "N/A"})`
      )
      .join("\n");

    const prompt = `You are providing a short safety alert for a jogger currently running in an area with several nearby hazards.

Summarize the overall situation in 2 to 3 sentences, describing what has been reported.
Avoid advice, credibility statements, instructions, or route suggestions. Use plain text only.

Nearby hazard reports:
${combined}

Output a single paragraph.`;

    const summary = await callOpenAI(prompt, { maxTokens: 220 });
    return summary || `${hazards.length} hazard(s) reported in this area.`;
  } catch (error) {
    console.error("AI grouped summary error:", error.response?.data || error.message);
    return `${hazards.length} hazard(s) reported in this area.`;
  }
};

export const generateRouteSafetyWarnings = async (safetyAnalysis) => {
  try {
    const { warnings = [], stats = {} } = safetyAnalysis || {};
    if (warnings.length === 0) {
      return [];
    }

    const warningsText = warnings
      .map((w, i) => `${i + 1}. [${w.severity?.toUpperCase() || "INFO"}] ${w.message} - ${w.advice}`)
      .join("\n");

    const statsText = `Total Distance: ${stats.total_distance_km?.toFixed(2) ?? "N/A"} km
Sidewalk Coverage: ${stats.sidewalk_coverage ? (stats.sidewalk_coverage * 100).toFixed(1) : "N/A"}%
Has Critical Warnings: ${stats.has_critical_warnings ? "Yes" : "No"}`;

    const prompt = `You are a running safety assistant analyzing a route for a jogger.

Based on the route analysis below, generate 1-3 concise, actionable safety warnings.
Each warning should be a single sentence, clear and helpful.

Rules:
- Consolidate similar warnings.
- Prioritize critical items.
- Natural, conversational language.
- No markdown or special formatting.
- If multiple warnings, separate them with " | ".

Route Analysis:
${warningsText}

Route Stats:
${statsText}

Output format: Warning 1 | Warning 2 | Warning 3`;

    const summary = await callOpenAI(prompt, { maxTokens: 320 });
    if (!summary) {
      return warnings;
    }

    return summary
      .split("|")
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({
        type: "ai_generated",
        severity: warnings[0]?.severity || "info",
        message: text,
        advice: "",
      }));
  } catch (error) {
    console.error("AI route safety analysis error:", error.response?.data || error.message);
    return safetyAnalysis?.warnings || [];
  }
};
