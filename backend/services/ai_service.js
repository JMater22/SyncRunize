import axios from "axios";
import axiosRetry from "axios-retry";
import dotenv from "dotenv";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.GPT_API_KEY;
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

// ✅ FIX: Configure retry logic for OpenAI API calls
// Retries on network errors and 5xx server errors (rate limits, timeouts)
axiosRetry(axios, {
  retries: 3, // Retry up to 3 times
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff: 1s, 2s, 4s
  retryCondition: (error) => {
    // Retry on network errors, 5xx errors, or rate limit errors (429)
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.response?.status === 429 || // Rate limit
           (error.response?.status >= 500 && error.response?.status < 600);
  },
  onRetry: (retryCount, error) => {
    console.warn(`[Retry ${retryCount}/3] OpenAI API call failed:`, error.message);
  }
});

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
    const prompt = `You are a running safety assistant generating brief voice alerts for joggers.

Write ONE clear, concise sentence that informs the runner about this hazard ahead.
The alert will be spoken out loud while they're running, so make it natural and easy to understand.

RULES:
- Maximum 15 words
- Use simple, conversational language (like talking to a friend)
- DO NOT include coordinates, latitude, longitude, or technical data
- DO NOT give advice or instructions
- DO NOT use markdown, emojis, or special characters
- Focus on WHAT the hazard is, not WHERE it is (the runner knows it's nearby)

Hazard Information:
- Type: ${hazard.incident_type || hazard.type || "Unknown hazard"}
- Details: ${hazard.description || "No additional details"}

Example good alerts:
- "Broken glass on the path ahead"
- "Pothole reported on this route"
- "Wet surface ahead, be careful"
- "Construction zone nearby"

Generate the alert now:`;

    const summary = await callOpenAI(prompt, { maxTokens: 50, temperature: 0.5 });
    return summary || "Hazard reported ahead on your route.";
  } catch (error) {
    console.error("AI summary error:", error.response?.data || error.message);
    return "Hazard reported ahead on your route.";
  }
};

export const summarizeTrafficAlert = async (traffic) => {
  try {
    const severityLevel = traffic.severity || traffic.severity_weight;
    const severityText = severityLevel > 0.7 ? "Heavy" : severityLevel > 0.4 ? "Moderate" : "Light";

    const prompt = `You are a running safety assistant generating voice alerts for joggers.

Create ONE short sentence to warn a runner about traffic conditions ahead.
This will be spoken out loud, so make it natural and conversational.

RULES:
- Maximum 12 words
- Simple, everyday language
- DO NOT include coordinates, latitude, longitude, or addresses
- DO NOT use markdown, emojis, or special characters
- Just state the traffic condition clearly

Traffic Information:
- Condition: ${traffic.condition || traffic.incident_type || "Traffic congestion"}
- Severity: ${severityText}
- Details: ${traffic.description || "No additional details"}

Example good alerts:
- "Heavy traffic ahead"
- "Road congestion on your route"
- "Slow moving vehicles nearby"
- "Traffic jam on the path"

Generate the alert now:`;

    const summary = await callOpenAI(prompt, { temperature: 0.5, maxTokens: 40 });
    return summary || `${severityText} traffic reported ahead.`;
  } catch (error) {
    console.error("AI traffic summary error:", error.response?.data || error.message);
    return "Traffic reported ahead on your route.";
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

export const summarizeBatchAlerts = async (hazards = [], clusters = []) => {
  const totalAlerts = hazards.length + clusters.length;
  if (totalAlerts === 0) {
    return null;
  }

  try {
    // Format hazards
    const hazardsList = hazards
      .map((h, idx) => {
        const type = h.incident_type || h.type || "Unknown hazard";
        const desc = h.description || "";
        const distance = h.distance_km ? ` (${(h.distance_km * 1000).toFixed(0)}m away)` : "";
        return `${idx + 1}. ${type}${desc ? `: ${desc}` : ""}${distance}`;
      })
      .join("\n");

    // Format accident clusters
    const clustersList = clusters
      .map((c, idx) => {
        const count = c.count || 0;
        const distance = c.distance_km ? ` (${(c.distance_km * 1000).toFixed(0)}m away)` : "";
        return `${hazards.length + idx + 1}. High-accident zone: ${count} incidents recorded${distance}`;
      })
      .join("\n");

    const alertsText = [hazardsList, clustersList].filter(Boolean).join("\n");

    const prompt = `You are a running safety assistant generating brief voice alerts for joggers.

Multiple safety alerts have been detected near the runner's current location.
Create ONE concise summary sentence (or two at most) that combines all these alerts.
This will be spoken out loud while running, so make it natural and easy to understand.

RULES:
- Maximum 25 words total
- Use simple, conversational language
- DO NOT include exact distances, coordinates, or technical data
- DO NOT give advice or instructions
- DO NOT use markdown, emojis, or special characters
- Prioritize the most critical alerts
- Use phrases like "ahead", "nearby", "on your route" instead of specific distances

Detected Alerts:
${alertsText}

Example good summaries:
- "3 hazards detected: broken glass, pothole, and wet surface ahead"
- "Approaching high-accident area with pothole and construction nearby"
- "Heavy traffic and broken glass on your route"

Generate the alert summary now:`;

    const summary = await callOpenAI(prompt, { maxTokens: 80, temperature: 0.6 });
    return summary || `${totalAlerts} alert${totalAlerts > 1 ? "s" : ""} detected on your route.`;
  } catch (error) {
    console.error("AI batch alert summary error:", error.response?.data || error.message);
    return `${totalAlerts} alert${totalAlerts > 1 ? "s" : ""} detected on your route.`;
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
