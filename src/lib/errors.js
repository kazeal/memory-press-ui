// Logs the real error for debugging while returning a friendly, generic
// message safe to show users — raw Postgres/storage errors (missing
// columns, RLS denials, etc.) shouldn't leak into the UI.
export function friendlyError(err, fallback) {
  console.error(err);
  return fallback;
}
