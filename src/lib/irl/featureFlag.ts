export function isIRLFeatureEnabled() {
  return String(process.env.IRL_FEATURE_ENABLED ?? 'false').trim().toLowerCase() === 'true';
}
