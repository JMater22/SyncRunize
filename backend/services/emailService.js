// services/emailService.js
import fetch from "node-fetch";

/**
 * Basic email format check (simple but effective for most cases).
 * Not perfect for all valid emails per RFC, but good enough here.
 */
const isValidEmailFormat = (email) => {
  if (typeof email !== "string") return false;
  // basic check: one "@" and at least one dot in domain part
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

const sanitizeDomain = (domain) => {
  if (!domain) return null;
  // remove surrounding whitespace and any accidental characters
  const cleaned = domain.trim().toLowerCase();
  // remove trailing dot if present (DNS responses often include trailing dot)
  return cleaned.endsWith(".") ? cleaned.slice(0, -1) : cleaned;
};

/**
 * Check if domain is a known disposable/temporary email service
 * Uses free disposable.debounce.io API (no auth required)
 */
const isDisposableDomain = async (domain) => {
  try {
    const url = `https://disposable.debounce.io/?email=${encodeURIComponent(domain)}`;
    const resp = await fetch(url, { timeout: 3000 });
    if (!resp.ok) {
      // If service is down, don't block - just log and continue
      console.warn("Disposable check service unavailable");
      return false;
    }
    const json = await resp.json();
    return json.disposable === true;
  } catch (err) {
    // If check fails, don't block the email - log and continue
    console.warn("Disposable email check failed:", err.message);
    return false;
  }
};

/**
 * Check for DNS records (MX first, then A) using Google DNS-over-HTTPS.
 * Also checks for disposable email domains.
 * Returns true if domain appears able to receive email and is not disposable.
 */
export const checkEmailDomain = async (email) => {
  try {
    if (!isValidEmailFormat(email)) {
      // quick fail for obviously invalid formats
      return false;
    }

    const parts = email.split("@");
    const rawDomain = parts[1];
    const domain = sanitizeDomain(rawDomain);
    if (!domain) return false;

    // Check for disposable email domains first (faster to reject early)
    const isDisposable = await isDisposableDomain(domain);
    if (isDisposable) {
      console.debug("Rejected disposable email domain:", domain);
      return false;
    }

    // Helper for DNS-over-HTTPS query
    const dnsQuery = async (type) => {
      const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`;
      const resp = await fetch(url, { timeout: 5000 });
      if (!resp.ok) {
        // non-200 from DNS endpoint -> treat as failure
        console.error("DNS endpoint returned non-OK:", resp.status, resp.statusText);
        return { ok: false };
      }
      const json = await resp.json();
      return { ok: true, json };
    };

    // 1) Check MX
    const mxResult = await dnsQuery("MX");
    if (!mxResult.ok) return false;
    const mxJson = mxResult.json;

    // Google DNS returns Status: 0 for NOERROR; Status: 3 for NXDOMAIN (name error)
    if (typeof mxJson.Status === "number" && mxJson.Status !== 0) {
      // Not NOERROR - treat as domain not valid for mail
      // Status 3 = NXDOMAIN, 2 = SERVFAIL, etc.
      console.debug("DNS Status not NOERROR:", mxJson.Status, "for domain", domain);
      return false;
    }

    if (Array.isArray(mxJson.Answer) && mxJson.Answer.length > 0) {
      // MX records present -> good
      return true;
    }

    // 2) No MX found — some domains accept mail on their A record. Check A record fallback.
    const aResult = await dnsQuery("A");
    if (!aResult.ok) return false;
    const aJson = aResult.json;
    if (typeof aJson.Status === "number" && aJson.Status !== 0) {
      // no A record either
      return false;
    }
    if (Array.isArray(aJson.Answer) && aJson.Answer.length > 0) {
      // A records present -> domain resolves (could accept mail)
      return true;
    }

    // No MX or A -> treat as not valid for receiving email
    return false;
  } catch (err) {
    console.error("checkEmailDomain error:", err);
    return false;
  }
};