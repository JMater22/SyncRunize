// services/award_service.js
import { getBadgeByChallenge } from "../models/badge_model.js";

export const computeProgressPercent = (userChallenge, challenge) => {
  const percent = Math.min(
    (userChallenge.total_distance_km / challenge.target_distance_km) * 100,
    100
  );
  const completed = percent >= 100;
  return { percent, completed };
};

export const awardBadgeIfQualified = async (userChallenge, challenge) => {
  const badge = await getBadgeByChallenge(challenge.challenge_id);
  if (!badge) return null;
  return badge;
};
