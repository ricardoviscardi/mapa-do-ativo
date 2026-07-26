import { buildRanking } from "@/lib/rankings/ranking-engine";
import { getRankingDefinition } from "@/lib/rankings/ranking-definitions";

export async function buildFeaturedRankings(slugs: string[]) {
  const definitions = slugs
    .map((slug) => getRankingDefinition(slug))
    .filter((definition): definition is NonNullable<typeof definition> => Boolean(definition));

  const settled = await Promise.allSettled(definitions.map((definition) => buildRanking(definition)));
  return settled
    .filter((result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof buildRanking>>> => result.status === "fulfilled")
    .map((result) => result.value);
}
