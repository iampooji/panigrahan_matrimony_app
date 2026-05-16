import { api } from "../api/apiClient";


/* =========================================================
   SEARCH MATCHES
   ========================================================= */

export const searchMatches = (params) => {
  const q = new URLSearchParams(params).toString();
  return api(`/profilematch/match?${q}`);
};


/* =========================================================
   SHARE PROFILE
   ========================================================= */

export const shareProfile = (profileId, matchId) =>
  api("/profilematch/share", {
    method: "POST",
    body: JSON.stringify({
      profileId,
      matchId
    })
  });


/* =========================================================
   REJECT PROFILE
   ========================================================= */

export const rejectProfile = (id, reason) =>
  api(`/profilematch/reject/${id}`, {
    method: "POST",
    body: JSON.stringify({
      reasoncode: reason
    })
  });


/* =========================================================
   OPTIONAL FUTURE ACTIONS
   ========================================================= */

export const acceptProfile = (id) =>
  api(`/profilematch/accept/${id}`, {
    method: "POST"
  });

export const cancelMatch = (id) =>
  api(`/profilematch/cancel/${id}`, {
    method: "POST"
  });
