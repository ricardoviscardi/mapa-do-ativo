export type RankingKind = "stock" | "fii";
export type RankingMetric =
  | "marketCap"
  | "dividendYield"
  | "pe"
  | "pvp"
  | "roe"
  | "roic"
  | "netMargin"
  | "volume"
  | "patrimony";

export type RankingDefinition = {
  slug: string;
  kind: RankingKind;
  metric: RankingMetric;
  direction: "asc" | "desc";
  title: string;
  h1: string;
  shortTitle: string;
  description: string;
  intro: string;
  valueLabel: string;
  minQualityScore: number;
  minItems: number;
  maxItems: number;
  glossarySlug?: string;
  methodology: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const rankingDefinitions: RankingDefinition[] = [
  {
    slug: "maiores-dividend-yield",
    kind: "stock",
    metric: "dividendYield",
    direction: "desc",
    title: "Ações com maior Dividend Yield",
    h1: "Ações com maior Dividend Yield hoje",
    shortTitle: "Maior DY em ações",
    description: "Ranking de ações brasileiras por Dividend Yield dos últimos 12 meses, com filtros por setor e dados disponíveis.",
    intro: "Compare ações brasileiras que mais distribuíram proventos em relação ao preço atual. O ranking evita ativos sem contexto suficiente e exclui percentuais fora da faixa comparável para não transformar evento extraordinário em falsa renda recorrente.",
    valueLabel: "Dividend Yield",
    minQualityScore: 60,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "dividend-yield",
    methodology: [
      "Usa o Dividend Yield saneado de 12 meses quando disponível ou calculado a partir dos proventos consolidados.",
      "Remove ativos sem cotação, sem dado de dividend yield válido ou com percentual fora da faixa comparável.",
      "O indicador é informativo e não representa recomendação de compra."
    ],
    faq: [
      {
        question: "Maior Dividend Yield significa melhor ação?",
        answer: "Não. Dividend yield alto pode refletir boa distribuição, mas também pode indicar queda forte no preço ou evento não recorrente. Use junto com lucro, endividamento e histórico."
      },
      {
        question: "O ranking usa dividendos futuros?",
        answer: "Não. A ordenação considera dados históricos disponíveis, principalmente os últimos 12 meses."
      }
    ]
  },
  {
    slug: "menores-pl",
    kind: "stock",
    metric: "pe",
    direction: "asc",
    title: "Ações com menor P/L",
    h1: "Ações com menor P/L positivo",
    shortTitle: "Menor P/L",
    description: "Veja ações brasileiras ordenadas pelo menor P/L positivo, com filtros por setor.",
    intro: "O P/L compara o preço da ação ao lucro por ação. Esta página prioriza múltiplos positivos e dados comparáveis para evitar distorções comuns em rankings automáticos.",
    valueLabel: "P/L",
    minQualityScore: 60,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "pl",
    methodology: [
      "Entram apenas ativos com P/L positivo e cotação disponível.",
      "Ativos com indicador ausente, negativo ou contexto insuficiente são removidos da ordenação.",
      "P/L baixo não significa necessariamente ação barata. É preciso analisar lucro recorrente e riscos."
    ],
    faq: [
      {
        question: "P/L baixo é sempre bom?",
        answer: "Não. Pode indicar preço descontado, mas também pode refletir queda esperada de lucro, risco elevado ou evento pontual."
      }
    ]
  },
  {
    slug: "menores-pvp",
    kind: "stock",
    metric: "pvp",
    direction: "asc",
    title: "Ações com menor P/VP",
    h1: "Ações com menor P/VP",
    shortTitle: "Menor P/VP em ações",
    description: "Ranking de ações brasileiras por menor preço sobre valor patrimonial, com filtros de comparação e setor.",
    intro: "O P/VP compara o valor de mercado com o patrimônio líquido contábil. O ranking ajuda a encontrar ativos negociados abaixo ou próximos do valor patrimonial, quando o dado existe.",
    valueLabel: "P/VP",
    minQualityScore: 60,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "pvp",
    methodology: [
      "Usa P/VP positivo, removendo valores zerados, negativos ou indisponíveis.",
      "Aplica filtros práticos para reduzir ativos com cadastro ou indicadores pouco comparáveis.",
      "O indicador pode ser menos útil para alguns setores."
    ],
    faq: [
      {
        question: "P/VP abaixo de 1 é sempre oportunidade?",
        answer: "Não. Pode indicar desconto, mas também pode refletir baixa rentabilidade, riscos regulatórios ou ativos difíceis de avaliar."
      }
    ]
  },
  {
    slug: "maiores-roe",
    kind: "stock",
    metric: "roe",
    direction: "desc",
    title: "Ações com maior ROE",
    h1: "Ações com maior ROE",
    shortTitle: "Maior ROE",
    description: "Compare ações brasileiras por retorno sobre patrimônio líquido, com filtros de comparação e setor.",
    intro: "O ROE mede a rentabilidade sobre o patrimônio líquido. Esta página destaca empresas com maior retorno, com filtros para facilitar comparações entre empresas do mesmo universo.",
    valueLabel: "ROE",
    minQualityScore: 60,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "roe",
    methodology: [
      "Ordena ativos por ROE disponível na base de indicadores.",
      "Remove valores ausentes ou pouco comparáveis.",
      "ROE muito alto deve ser conferido junto com endividamento e margem."
    ],
    faq: [
      {
        question: "ROE alto significa empresa excelente?",
        answer: "Ajuda, mas não basta. Um ROE alto pode vir de boa rentabilidade ou de patrimônio líquido muito reduzido."
      }
    ]
  },
  {
    slug: "maiores-roic",
    kind: "stock",
    metric: "roic",
    direction: "desc",
    title: "Ações com maior ROIC",
    h1: "Ações com maior ROIC",
    shortTitle: "Maior ROIC",
    description: "Ranking de ações brasileiras por retorno sobre capital investido, com filtros de comparação.",
    intro: "O ROIC ajuda a comparar empresas pelo retorno gerado sobre o capital investido. É um ranking útil para encontrar negócios mais eficientes, desde que analisado com contexto setorial.",
    valueLabel: "ROIC",
    minQualityScore: 60,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "roic",
    methodology: [
      "Ordena pelo ROIC disponível entre os indicadores consolidados.",
      "Prioriza ativos com preço, histórico, indicadores e fundamentos mínimos.",
      "Pode não ser comparável entre setores muito diferentes."
    ],
    faq: [
      {
        question: "ROIC é melhor que ROE?",
        answer: "Depende do objetivo. O ROIC costuma ser melhor para avaliar eficiência do negócio, enquanto o ROE olha o retorno sobre patrimônio líquido."
      }
    ]
  },
  {
    slug: "maiores-valor-de-mercado",
    kind: "stock",
    metric: "marketCap",
    direction: "desc",
    title: "Maiores empresas da bolsa por valor de mercado",
    h1: "Maiores ações brasileiras por valor de mercado",
    shortTitle: "Maior valor de mercado",
    description: "Ranking das maiores empresas brasileiras monitoradas pelo Mapa do Ativo por valor de mercado.",
    intro: "Veja quais empresas aparecem com maior valor de mercado na diretório. A lista remove ativos sem cotação ou valor de mercado confiável.",
    valueLabel: "Valor de mercado",
    minQualityScore: 55,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "valor-de-mercado",
    methodology: [
      "Usa o valor de mercado retornado pela base de cotação.",
      "Remove ativos sem preço ou sem market cap disponível.",
      "O ranking pode mudar conforme a atualização dos dados de mercado."
    ],
    faq: [
      {
        question: "Valor de mercado é igual a valor justo?",
        answer: "Não. Valor de mercado é o preço corrente multiplicado pela quantidade de ações. Valor justo exige análise própria."
      }
    ]
  },
  {
    slug: "acoes-mais-negociadas",
    kind: "stock",
    metric: "volume",
    direction: "desc",
    title: "Ações mais negociadas",
    h1: "Ações brasileiras mais negociadas",
    shortTitle: "Maior volume em ações",
    description: "Ranking de ações brasileiras por volume do último pregão disponível na base.",
    intro: "Compare ações com maior volume negociado entre os ativos monitorados. Volume ajuda a medir liquidez, mas não diz se o ativo é bom ou barato.",
    valueLabel: "Volume",
    minQualityScore: 50,
    minItems: 5,
    maxItems: 30,
    methodology: [
      "Usa o volume retornado na cotação mais recente.",
      "Remove ativos sem volume ou cotação confiável.",
      "Volume alto indica maior negociação, não análise fundamentalista."
    ],
    faq: [
      {
        question: "Volume alto significa ação melhor?",
        answer: "Não. Volume alto indica maior negociação e liquidez, mas não substitui análise de fundamentos."
      }
    ]
  },
  {
    slug: "fiis-maior-dividend-yield",
    kind: "fii",
    metric: "dividendYield",
    direction: "desc",
    title: "FIIs com maior Dividend Yield",
    h1: "FIIs com maior Dividend Yield hoje",
    shortTitle: "Maior DY em FIIs",
    description: "Ranking de fundos imobiliários por Dividend Yield dos últimos 12 meses, com filtros de segmento.",
    intro: "Veja FIIs com maior rendimento em relação ao preço atual. O ranking prioriza fundos com rendimentos recentes, cotação disponível, filtros de leitura e mantém uma faixa comparável de dividend yield.",
    valueLabel: "Dividend Yield",
    minQualityScore: 55,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "dividend-yield",
    methodology: [
      "Usa dividend yield saneado dos últimos 12 meses quando disponível ou calculado por rendimentos consolidados.",
      "Remove fundos sem cotação, sem rendimentos válidos, com dados muito limitados ou com DY acima de 20% por ser potencialmente atípico.",
      "Dividend yield alto pode refletir risco, amortização, venda de imóvel, evento não recorrente ou queda no preço da cota."
    ],
    faq: [
      {
        question: "FII com maior DY é sempre melhor?",
        answer: "Não. É preciso avaliar qualidade dos imóveis, vacância, contratos, endividamento e recorrência dos rendimentos."
      }
    ]
  },
  {
    slug: "fiis-menor-pvp",
    kind: "fii",
    metric: "pvp",
    direction: "asc",
    title: "FIIs com menor P/VP",
    h1: "FIIs com menor P/VP",
    shortTitle: "Menor P/VP em FIIs",
    description: "Compare FIIs por menor preço sobre valor patrimonial, com filtros de comparação e segmento.",
    intro: "O P/VP mostra quanto a cota negocia em relação ao valor patrimonial. Este ranking filtra valores positivos e remove fundos com dados fora do padrão.",
    valueLabel: "P/VP",
    minQualityScore: 55,
    minItems: 5,
    maxItems: 30,
    glossarySlug: "pvp",
    methodology: [
      "Entram apenas FIIs com P/VP positivo e cotação disponível.",
      "O ranking remove dados ausentes ou evidentemente fora do padrão.",
      "P/VP baixo não garante oportunidade. Pode indicar risco, baixa liquidez ou problemas do fundo."
    ],
    faq: [
      {
        question: "P/VP menor que 1 em FII é sempre bom?",
        answer: "Não. Pode indicar desconto, mas também pode refletir risco de vacância, revisões de laudo ou baixa qualidade dos ativos."
      }
    ]
  },
  {
    slug: "fiis-maior-patrimonio",
    kind: "fii",
    metric: "patrimony",
    direction: "desc",
    title: "FIIs com maior patrimônio",
    h1: "FIIs com maior patrimônio líquido",
    shortTitle: "Maior patrimônio",
    description: "Ranking de FIIs por patrimônio líquido ou valor patrimonial disponível na base.",
    intro: "Veja fundos imobiliários com maior patrimônio líquido entre os FIIs monitorados. O ranking prioriza fundos com dados cadastrais e patrimoniais disponíveis.",
    valueLabel: "Patrimônio",
    minQualityScore: 50,
    minItems: 5,
    maxItems: 30,
    methodology: [
      "Usa patrimônio líquido quando disponível no cadastro ou indicadores do fundo.",
      "Quando o patrimônio não está disponível, o fundo não entra neste ranking.",
      "Patrimônio maior não significa necessariamente melhor rentabilidade."
    ],
    faq: [
      {
        question: "Patrimônio maior indica FII melhor?",
        answer: "Não necessariamente. Patrimônio maior pode trazer escala, mas a qualidade depende dos ativos, gestão, contratos e preço da cota."
      }
    ]
  },
  {
    slug: "fiis-mais-negociados",
    kind: "fii",
    metric: "volume",
    direction: "desc",
    title: "FIIs mais negociados",
    h1: "FIIs mais negociados na diretório",
    shortTitle: "Maior volume em FIIs",
    description: "Ranking de FIIs por volume do último pregão disponível no Mapa do Ativo.",
    intro: "Compare fundos imobiliários por volume negociado. O ranking ajuda a observar liquidez, mas deve ser combinado com análise de rendimentos, P/VP e patrimônio.",
    valueLabel: "Volume",
    minQualityScore: 45,
    minItems: 5,
    maxItems: 30,
    methodology: [
      "Usa o volume do último pregão disponível.",
      "Remove fundos sem cotação ou volume válido.",
      "Liquidez não substitui análise de qualidade do fundo."
    ],
    faq: [
      {
        question: "Volume alto em FII é importante?",
        answer: "Ajuda na liquidez, mas não determina se o fundo é bom. Avalie também patrimônio, gestão, vacância e rendimentos."
      }
    ]
  }
];

export function getRankingDefinition(slug: string): RankingDefinition | undefined {
  return rankingDefinitions.find((ranking) => ranking.slug === slug);
}
