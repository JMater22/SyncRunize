// models/stats_model.js
import { supabase } from "../utils/supabase.js";

export const getUserStats = async (userId, period = "month", startDate = null, endDate = null) => {
  try {
    const { data, error } = await supabase
      .from("user_routes")
      .select("distance_km, average_pace, estimated_calories, created_at")
      .eq("user_id", userId);

    if (error) throw error;

    // Apply date range filter
    const filtered = data.filter((r) => {
      const date = new Date(r.created_at);
      if (startDate && date < new Date(startDate)) return false;
      if (endDate && date > new Date(endDate)) return false;
      return true;
    });

    if (!filtered.length) return [];

    // Group runs by chosen period
    const groups = {};
    filtered.forEach((r) => {
      const d = new Date(r.created_at);
      let key;

      if (period === "day") {
        key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      } else if (period === "week") {
        const firstDayOfWeek = new Date(d);
        firstDayOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
        key = firstDayOfWeek.toISOString().split("T")[0];
      } else {
        // month
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });

    // Aggregate per group
    const aggregated = Object.entries(groups).map(([key, runs]) => {
      const totalDistance = runs.reduce((sum, r) => sum + (r.distance_km || 0), 0);
      const avgPace = runs.reduce((sum, r) => sum + (r.average_pace || 0), 0) / runs.length;
      const totalCalories = runs.reduce((sum, r) => sum + (r.estimated_calories || 0), 0);

      return {
        period_start: key,
        total_distance: totalDistance,
        avg_pace: avgPace,
        total_calories: totalCalories,
        runs_count: runs.length,
      };
    });

    // Sort chronologically
    aggregated.sort((a, b) => new Date(a.period_start) - new Date(b.period_start));

    return aggregated;
  } catch (err) {
    console.error("Error fetching user stats:", err);
    throw err;
  }
};

export const getCurrentPeriodStats = async (userId, period = "month") => {
  const now = new Date();
  let startDate;

  if (period === "day") {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    startDate = new Date();
    const day = startDate.getDay(); // Sunday = 0
    startDate.setDate(startDate.getDate() - day);
    startDate.setHours(0, 0, 0, 0);
  } else {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const results = await getUserStats(userId, period, startDate.toISOString());
  // Return only the most recent period if there are multiple
  return results[results.length - 1] || {
    total_distance: 0,
    avg_pace: 0,
    total_calories: 0,
    runs_count: 0,
    period_start: null,
  };
};

/**
 * Compute personal records for a user (longest distance, duration, fastest pace, max calories)
 */
export const getPersonalRecords = async (userId) => {
  const { data, error } = await supabase
    .from("user_routes")
    .select(`
      route_id,
      distance_km,
      duration_seconds,
      average_pace,
      estimated_calories,
      created_at,
      route_status
    `)
    .eq("user_id", userId)
    .eq("route_status", "completed");

  if (error) throw error;

  const responseTemplate = {
    run_id: null,
    route_id: null,
    occurred_at: null,
    value: null,
    previous_value: null,
    improvement_percent: null,
  };

  if (!data || data.length === 0) {
    return {
      distance: { ...responseTemplate },
      duration: { ...responseTemplate },
      pace: { ...responseTemplate },
      calories: { ...responseTemplate },
    };
  }

  const coerceNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value === "string") {
      if (value.includes(":")) {
        const [mins, secs = "0"] = value.split(":");
        const parsedMins = Number(mins);
        const parsedSecs = Number(secs);
        if (Number.isFinite(parsedMins) && Number.isFinite(parsedSecs)) {
          return parsedMins + parsedSecs / 60;
        }
      }
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  };

  const buildRecord = (records, key, { higherIsBetter = true, minDistance = null } = {}) => {
    const filtered = records
      .filter((r) => {
        const value = coerceNumber(r[key]);
        if (value === null) return false;
        if (minDistance !== null) {
          const distance = coerceNumber(r.distance_km);
          if (distance === null || distance < minDistance) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aVal = coerceNumber(a[key]) ?? 0;
        const bVal = coerceNumber(b[key]) ?? 0;
        return higherIsBetter ? bVal - aVal : aVal - bVal;
      });

    if (filtered.length === 0) {
      return { ...responseTemplate };
    }

    const best = filtered[0];
    const runnerUp = filtered[1];

    const bestValue = coerceNumber(best[key]);
    const prevValue = runnerUp ? coerceNumber(runnerUp[key]) : null;

    let improvementPercent = null;
    if (bestValue !== null && prevValue !== null && prevValue !== 0) {
      improvementPercent = higherIsBetter
        ? ((bestValue - prevValue) / prevValue) * 100
        : ((prevValue - bestValue) / prevValue) * 100;
    }

    return {
      run_id: best.route_id,
      route_id: best.route_id,
      occurred_at: best.created_at,
      value: bestValue,
      previous_value: prevValue,
      improvement_percent: improvementPercent,
    };
  };

  return {
    distance: buildRecord(data, "distance_km"),
    duration: buildRecord(data, "duration_seconds"),
    pace: buildRecord(data, "average_pace", { higherIsBetter: false, minDistance: 3 }),
    calories: buildRecord(data, "estimated_calories"),
  };
};
