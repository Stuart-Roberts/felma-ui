// src/people.js
// Map whatever your item.user_id looks like (phone/email) to a nice display name.
export const PEOPLE = {
  // TODO: put real values you have for the pilot.
  // Examples:
  "+447000000001": "Kate",        // Team Leader
  "+447000000002": "Helen-Marie",
  "+447000000003": "Charlotte",
  "+447000000004": "Lauren",
  "+447000000005": "Liz",
  // You (so your own items berry-highlight correctly):
  // "+44YOURNUMBER": "Stuart",
};

// Return the best display label for an ID (phone/email) or name string.
export function displayName(idOrName) {
  if (!idOrName) return "—";
  // If the value itself is a known key, map it.
  if (PEOPLE[idOrName]) return PEOPLE[idOrName];
  // If someone typed a nice name directly (no + or @), show it as-is.
  if (!String(idOrName).startsWith("+") && !String(idOrName).includes("@")) {
    return idOrName;
  }
  // Fallback to the original (e.g., phone) if we don't have a mapping.
  return idOrName;
}

// Does the viewer's "Me" value equal this user?
// We consider equal if exact match OR if the viewer typed the mapped name.
export function isMine(viewerMe, userId) {
  if (!viewerMe) return false;
  const mine = String(viewerMe).trim().toLowerCase();
  const raw = String(userId || "").trim().toLowerCase();
  const mapped = String(displayName(userId)).trim().toLowerCase();
  return mine === raw || mine === mapped;
}
