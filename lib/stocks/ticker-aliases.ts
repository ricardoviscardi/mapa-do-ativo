export const tickerAliases: Record<string, string> = {
  NTCO3: "NATU3",
  EMBR3: "EMBJ3",
  ELET3: "AXIA3",
  ELET5: "AXIA5",
  ELET6: "AXIA6",
  BRFS3: "MBRF3",
  MRFG3: "MBRF3",
  JBSS3: "JBSS32",
};

export const tickerAliasReasons: Record<string, string> = {
  NTCO3: "NTCO3 foi substituído por NATU3. Exibindo o ticker atual da Natura.",
  EMBR3: "EMBR3 foi substituído por EMBJ3. Exibindo o ticker atual da Embraer.",
  ELET3: "ELET3 foi substituído por AXIA3. Exibindo o ticker atual da Axia Energia, antiga Eletrobras.",
  ELET5: "ELET5 foi substituído por AXIA5. Exibindo o ticker atual da Axia Energia, antiga Eletrobras.",
  ELET6: "ELET6 foi substituído por AXIA6. Exibindo o ticker atual da Axia Energia, antiga Eletrobras.",
  BRFS3: "BRFS3 foi incorporado ao novo ticker MBRF3. Exibindo o ticker atual.",
  MRFG3: "MRFG3 passou a ser representado por MBRF3. Exibindo o ticker atual.",
  JBSS3: "JBSS3 deixou de ser ação ordinária negociada diretamente. Exibindo o BDR atual JBSS32 quando houver dados disponíveis.",
};

export function normalizeTickerCode(value: string): string {
  return value.trim().toUpperCase().replace(/\.SA$/i, "").replace(/[^A-Z0-9]/g, "");
}

export function resolveCurrentTicker(value: string): string {
  const normalized = normalizeTickerCode(value);
  return tickerAliases[normalized] ?? normalized;
}

export function tickerAliasWarning(value: string): string | null {
  const normalized = normalizeTickerCode(value);
  return tickerAliasReasons[normalized] ?? null;
}
