/**
 * Halachic / product rules for discovery & suggestions.
 * CRITICAL: Male Cohen must NOT be shown divorced women (widow allowed unless product changes).
 *
 * @param {{ gender?: string, is_cohen?: number|null, marital_status?: string }} viewer
 * @param {{ gender?: string, marital_status?: string }} candidate
 * @returns {{ allowed: boolean, reason?: string }}
 */
function canSuggestCandidateForViewer(viewer, candidate) {
  if (!viewer || !candidate) {
    return { allowed: false, reason: "MISSING_PROFILE" };
  }

  const isMaleCohen =
    String(viewer.gender || "").toLowerCase() === "male" && Number(viewer.is_cohen) === 1;

  if (isMaleCohen) {
    const ms = String(candidate.marital_status || "").toLowerCase();
    if (ms === "divorced") {
      return { allowed: false, reason: "COHEN_EXCLUDES_DIVORCED_WOMAN" };
    }
  }

  return { allowed: true };
}

/**
 * SQL fragment helpers for candidate queries (indexed columns).
 * Use: AND (${cohenDivorcedClause('p_viewer', 'p_candidate')})
 */
function cohenDivorcedSql(viewerAlias, candidateAlias) {
  return `NOT (
    ${viewerAlias}.gender = 'male'
    AND ${viewerAlias}.is_cohen = 1
    AND ${candidateAlias}.gender = 'female'
    AND ${candidateAlias}.marital_status = 'divorced'
  )`;
}

module.exports = {
  canSuggestCandidateForViewer,
  cohenDivorcedSql
};
