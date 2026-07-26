export function isProductionBuildPhase(): boolean {
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.npm_lifecycle_event === "build" ||
    process.env.MAPA_DO_ATIVO_BUILD_SKIP_EXTERNAL === "true"
  );
}
