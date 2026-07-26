import type { Metadata } from "next";
import type { SeoHubPageProps } from "@/components/content/SeoHubPage";

export type HubPageDefinition = SeoHubPageProps & {
  slug: string;
  path: string;
  metadata: Metadata;
};

const commonStockGlossary = [
  { label: "Dividend Yield", href: "/glossario/dividend-yield" },
  { label: "P/L", href: "/glossario/pl" },
  { label: "P/VP", href: "/glossario/pvp" },
  { label: "ROE", href: "/glossario/roe" },
  { label: "Valor de mercado", href: "/glossario/valor-de-mercado" },
];

const commonFiiGlossary = [
  { label: "Dividend Yield", href: "/glossario/dividend-yield" },
  { label: "P/VP", href: "/glossario/pvp" },
  { label: "VP/Cota", href: "/glossario/valor-patrimonial-por-cota" },
  { label: "Vacância", href: "/glossario/vacancia" },
  { label: "Segmento de FII", href: "/glossario/segmento-de-fii" },
];

export const stockDividendHub: HubPageDefinition = {
  slug: "acoes-dividendos",
  path: "/acoes/dividendos",
  metadata: {
    title: "Ações que pagam dividendos: dados, DY e cuidados",
    description: "Veja como analisar ações que pagam dividendos usando Dividend Yield, payout, histórico de proventos e filtros de comparação.",
    alternates: { canonical: "/acoes/dividendos" },
  },
  eyebrow: "Ações e dividendos",
  title: "Ações que pagam dividendos: veja dados, histórico e indicadores",
  description: "Use esta página como ponto de partida para analisar ações pagadoras de dividendos sem cair na armadilha de olhar apenas o maior Dividend Yield.",
  stats: [
    { label: "Indicador central", value: "DY 12m", description: "Mostra proventos dos últimos 12 meses em relação ao preço atual." },
    { label: "Cuidado principal", value: "Recorrência", description: "DY alto pode vir de evento extraordinário ou queda forte na cotação." },
    { label: "Próximo passo", value: "Ranking", description: "Compare ações com filtros de comparação e metodologia clara." },
  ],
  sections: [
    {
      title: "Como analisar dividendos com mais segurança",
      description: "Dividendos são importantes, mas precisam ser avaliados junto com lucro, caixa, dívida e regularidade.",
      bullets: [
        "Compare o Dividend Yield com o histórico de pagamentos e não apenas com o último provento.",
        "Verifique se o pagamento veio de lucro recorrente ou de evento extraordinário.",
        "Observe payout, lucro por ação, dívida líquida/EBITDA e fluxo de caixa antes de concluir que o dividendo é sustentável.",
      ],
    },
    {
      title: "Por que o maior DY pode enganar",
      description: "Um DY muito alto pode indicar algo fora do normal, não necessariamente uma oportunidade.",
      bullets: [
        "Queda forte no preço aumenta matematicamente o Dividend Yield.",
        "Proventos extraordinários podem elevar o DY de 12 meses sem representar renda futura.",
        "O Mapa do Ativo usa filtros conservadores nos rankings para reduzir destaque de dados atípicos.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Ações com maior Dividend Yield", href: "/rankings/maiores-dividend-yield", description: "Ranking conservador com filtro de dados atípicos." },
    { label: "Ações mais negociadas", href: "/rankings/acoes-mais-negociadas", description: "Veja ativos com maior volume na diretório." },
    { label: "Glossário de Dividend Yield", href: "/glossario/dividend-yield", description: "Entenda fórmula, exemplo e armadilhas do indicador." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Ação com maior DY é sempre melhor?", answer: "Não. DY alto pode vir de queda no preço ou pagamento não recorrente." },
    { question: "O que olhar além do dividendo?", answer: "Lucro, caixa, payout, dívida, setor, regularidade e qualidade da empresa." },
  ],
};

export const stockMarketCapHub: HubPageDefinition = {
  slug: "acoes-valor-de-mercado",
  path: "/acoes/valor-de-mercado",
  metadata: {
    title: "Valor de mercado das ações: compare empresas da B3",
    description: "Entenda valor de mercado, tamanho das empresas, liquidez e rankings de ações brasileiras.",
    alternates: { canonical: "/acoes/valor-de-mercado" },
  },
  eyebrow: "Tamanho das empresas",
  title: "Valor de mercado das ações brasileiras",
  description: "Compare empresas pelo tamanho de mercado, entendendo que market cap ajuda a medir porte, liquidez e relevância, mas não define preço justo.",
  stats: [
    { label: "Métrica", value: "Market cap", description: "Preço da ação multiplicado pela quantidade de ações." },
    { label: "Uso prático", value: "Porte", description: "Ajuda a distinguir empresas grandes, médias e menores." },
    { label: "Cuidado", value: "Preço ≠ valor", description: "Empresa grande não é automaticamente oportunidade." },
  ],
  sections: [
    {
      title: "Como usar valor de mercado",
      description: "O valor de mercado ajuda a entender a escala da empresa e sua representatividade na bolsa.",
      bullets: [
        "Empresas maiores tendem a ter mais liquidez e cobertura de mercado.",
        "Market cap deve ser lido junto com lucro, dívida, crescimento e retorno sobre capital.",
        "Para comparar valuation, use também P/L, EV/EBITDA, ROE e geração de caixa.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Ações com maior valor de mercado", href: "/rankings/maiores-valor-de-mercado", description: "Ranking de empresas por valor de mercado." },
    { label: "Ações mais negociadas", href: "/rankings/acoes-mais-negociadas", description: "Veja liquidez e volume negociado." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Valor de mercado alto indica ação cara?", answer: "Não necessariamente. Ele mede tamanho, não atratividade." },
    { question: "Market cap e valor da firma são iguais?", answer: "Não. Valor da firma também considera dívida líquida." },
  ],
};

export const stockIndicatorsHub: HubPageDefinition = {
  slug: "acoes-indicadores",
  path: "/acoes/indicadores",
  metadata: {
    title: "Indicadores de ações: P/L, P/VP, ROE, ROIC e DY",
    description: "Entenda os principais indicadores de ações brasileiras e acesse rankings com filtros de comparação.",
    alternates: { canonical: "/acoes/indicadores" },
  },
  eyebrow: "Indicadores de ações",
  title: "Indicadores fundamentalistas para analisar ações",
  description: "Uma visão organizada dos principais indicadores usados para comparar empresas brasileiras, com links para glossário e rankings.",
  stats: [
    { label: "Preço", value: "P/L e P/VP", description: "Ajudam a comparar preço com lucro e patrimônio." },
    { label: "Rentabilidade", value: "ROE e ROIC", description: "Mostram retorno gerado sobre patrimônio e capital." },
    { label: "Renda", value: "DY", description: "Resume proventos em relação ao preço." },
  ],
  sections: [
    {
      title: "Indicador nenhum trabalha sozinho",
      description: "O bom uso dos indicadores nasce da combinação entre preço, qualidade, rentabilidade e risco.",
      bullets: [
        "P/L e P/VP ajudam na leitura de preço, mas podem enganar quando lucro ou patrimônio estão distorcidos.",
        "ROE e ROIC ajudam a medir qualidade, mas precisam ser analisados com dívida e setor.",
        "Dividend Yield precisa ser separado entre renda recorrente e evento extraordinário.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Ações com menor P/L", href: "/rankings/menores-pl", description: "Compare múltiplos de lucro." },
    { label: "Ações com menor P/VP", href: "/rankings/menores-pvp", description: "Compare preço e patrimônio." },
    { label: "Ações com maior ROE", href: "/rankings/maiores-roe", description: "Veja rentabilidade sobre patrimônio." },
    { label: "Ações com maior ROIC", href: "/rankings/maiores-roic", description: "Veja retorno sobre capital investido." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Qual indicador é o mais importante?", answer: "Depende do setor e do objetivo. O ideal é combinar vários indicadores." },
    { question: "Posso comparar qualquer empresa pelo mesmo indicador?", answer: "Comparações são melhores entre empresas do mesmo setor." },
  ],
};

export const stockSectorsHub: HubPageDefinition = {
  slug: "acoes-setores",
  path: "/acoes/setores",
  metadata: {
    title: "Setores da bolsa: compare ações por segmento",
    description: "Entenda por que comparar ações por setor melhora a análise de indicadores e rankings.",
    alternates: { canonical: "/acoes/setores" },
  },
  eyebrow: "Setores da bolsa",
  title: "Ações por setor: compare empresas com mais contexto",
  description: "Comparar empresas do mesmo setor reduz distorções e deixa indicadores como P/L, margem, ROE e dívida mais úteis.",
  stats: [
    { label: "Comparação", value: "Setorial", description: "Mais justa do que comparar empresas de negócios completamente diferentes." },
    { label: "Indicadores", value: "Contexto", description: "Margens, dívida e múltiplos variam muito por setor." },
    { label: "Uso", value: "Filtros", description: "Rankings com setor ajudam a encontrar pares comparáveis." },
  ],
  sections: [
    {
      title: "Por que setor importa",
      description: "Cada setor tem margem, ciclo, endividamento e múltiplos próprios.",
      bullets: [
        "Bancos, utilities, varejo e tecnologia têm estruturas financeiras muito diferentes.",
        "Empresas cíclicas podem parecer baratas no pico de lucro e caras no fundo do ciclo.",
        "Rankings por setor ajudam a comparar pares mais parecidos.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Rankings de ações", href: "/rankings", description: "Use filtros de setor nos rankings interativos." },
    { label: "Ações com maior valor de mercado", href: "/rankings/maiores-valor-de-mercado", description: "Veja empresas de maior porte." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Por que não comparar banco com varejo?", answer: "Porque as métricas contábeis e o modelo de negócio são muito diferentes." },
    { question: "Setor define se uma ação é boa?", answer: "Não. Ele dá contexto, mas a análise depende da empresa e do preço." },
  ],
};

export const fiiRendimentosHub: HubPageDefinition = {
  slug: "fiis-rendimentos",
  path: "/fiis/rendimentos",
  metadata: {
    title: "FIIs com rendimentos: DY, recorrência e cuidados",
    description: "Veja como analisar rendimentos de FIIs usando Dividend Yield, P/VP, segmento, patrimônio e contexto dos dados.",
    alternates: { canonical: "/fiis/rendimentos" },
  },
  eyebrow: "Rendimentos de FIIs",
  title: "FIIs com rendimentos: compare DY, P/VP e contexto dos dados",
  description: "Uma página para entender rendimentos de fundos imobiliários sem confundir pagamento recorrente com amortização ou evento extraordinário.",
  stats: [
    { label: "Indicador", value: "DY 12m", description: "Resume rendimentos em relação ao preço da cota." },
    { label: "Cuidado", value: "Amortização", description: "Pode distorcer o rendimento aparente." },
    { label: "Contexto", value: "Segmento", description: "Papel, logística e shopping têm riscos distintos." },
  ],
  sections: [
    {
      title: "Como olhar rendimentos de FIIs",
      description: "Rendimento mensal é importante, mas precisa ser sustentável e compatível com a estratégia do fundo.",
      bullets: [
        "Verifique se o rendimento vem da operação recorrente ou de evento atípico.",
        "Compare fundos do mesmo segmento antes de concluir que um DY é alto ou baixo.",
        "Observe patrimônio, P/VP, liquidez, vacância e qualidade dos contratos quando houver dados disponíveis.",
      ],
    },
  ],
  primaryLinks: [
    { label: "FIIs com maior Dividend Yield", href: "/rankings/fiis-maior-dividend-yield", description: "Ranking com filtro conservador para DY atípico." },
    { label: "FIIs com menor P/VP", href: "/rankings/fiis-menor-pvp", description: "Compare preço da cota com patrimônio." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "FII com maior rendimento é sempre melhor?", answer: "Não. Pode haver maior risco, amortização, vacância ou evento não recorrente." },
    { question: "Rendimento de FII é garantido?", answer: "Não. Rendimentos variam conforme resultado, caixa, gestão e mercado." },
  ],
};

export const fiiDividendYieldHub: HubPageDefinition = {
  slug: "fiis-dividend-yield",
  path: "/fiis/dividend-yield",
  metadata: {
    title: "Dividend Yield de FIIs: como interpretar sem erro",
    description: "Entenda o Dividend Yield de FIIs, cuidados com DY alto, amortização e rankings conservadores.",
    alternates: { canonical: "/fiis/dividend-yield" },
  },
  eyebrow: "DY em FIIs",
  title: "Dividend Yield de FIIs: como interpretar sem cair em distorções",
  description: "DY em FII pode ser útil, mas precisa separar renda recorrente, amortização, eventos extraordinários e queda de preço.",
  stats: [
    { label: "Base", value: "12 meses", description: "O DY normalmente usa rendimentos dos últimos 12 meses." },
    { label: "Filtro", value: "Atípicos", description: "Valores extremos precisam ser tratados com cautela." },
    { label: "Comparação", value: "Segmento", description: "Compare FIIs de perfil semelhante." },
  ],
  sections: [
    {
      title: "O que pode inflar o DY de um FII",
      description: "Nem todo rendimento elevado representa renda recorrente.",
      bullets: [
        "Amortizações podem entrar no histórico de pagamentos e elevar artificialmente o DY.",
        "Venda de imóvel ou evento extraordinário pode gerar pagamento que não se repete.",
        "Queda forte da cota aumenta o DY matematicamente, mesmo que o rendimento esteja caindo.",
      ],
    },
  ],
  primaryLinks: [
    { label: "FIIs com maior Dividend Yield", href: "/rankings/fiis-maior-dividend-yield", description: "Ranking com filtro de consistência." },
    { label: "Glossário de amortização", href: "/glossario/amortizacao", description: "Entenda por que amortização não é renda recorrente." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "DY de FII pode passar de 20%?", answer: "Pode aparecer, mas normalmente exige leitura especial por evento extraordinário, amortização ou distorção de preço." },
    { question: "O Mapa do Ativo mostra qualquer DY?", answer: "Não nos rankings. Valores muito atípicos são filtrados para evitar leitura enganosa." },
  ],
};

export const fiiPvpHub: HubPageDefinition = {
  slug: "fiis-pvp",
  path: "/fiis/pvp",
  metadata: {
    title: "P/VP de FIIs: compare preço e patrimônio",
    description: "Entenda o P/VP de FIIs, valor patrimonial por cota e cuidados antes de buscar fundos com desconto.",
    alternates: { canonical: "/fiis/pvp" },
  },
  eyebrow: "P/VP em FIIs",
  title: "P/VP de FIIs: compare preço da cota e valor patrimonial",
  description: "O P/VP ajuda a identificar FIIs negociando abaixo ou acima do patrimônio, mas não substitui análise de qualidade do fundo.",
  stats: [
    { label: "Fórmula", value: "Preço ÷ VP/Cota", description: "Compara mercado e patrimônio." },
    { label: "Leitura", value: "< 1", description: "Pode indicar desconto, mas também risco." },
    { label: "Cuidado", value: "Qualidade", description: "Patrimônio ruim também pode negociar barato." },
  ],
  sections: [
    {
      title: "Como interpretar P/VP de FIIs",
      description: "P/VP baixo chama atenção, mas precisa ser explicado.",
      bullets: [
        "Desconto pode refletir risco de vacância, imóveis de baixa qualidade, gestão ruim ou baixa liquidez.",
        "P/VP acima de 1 pode ser aceitável quando o fundo tem imóveis ou contratos de alta qualidade.",
        "Compare FIIs do mesmo segmento para reduzir distorções.",
      ],
    },
  ],
  primaryLinks: [
    { label: "FIIs com menor P/VP", href: "/rankings/fiis-menor-pvp", description: "Ranking de fundos por preço sobre valor patrimonial." },
    { label: "FIIs com maior patrimônio", href: "/rankings/fiis-maior-patrimonio", description: "Veja fundos de maior patrimônio na diretório." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "FII abaixo do VP é sempre barato?", answer: "Não. O desconto pode refletir risco real ou baixa qualidade do patrimônio." },
    { question: "P/VP serve para FII de papel?", answer: "Serve como referência, mas a análise deve considerar carteira, risco de crédito e indexadores." },
  ],
};

export const fiiSegmentsHub: HubPageDefinition = {
  slug: "fiis-segmentos",
  path: "/fiis/segmentos",
  metadata: {
    title: "Segmentos de FIIs: logística, papel, shopping e mais",
    description: "Entenda segmentos de fundos imobiliários e como comparar FIIs com mais contexto.",
    alternates: { canonical: "/fiis/segmentos" },
  },
  eyebrow: "Segmentos de FIIs",
  title: "Segmentos de FIIs: compare fundos com mais contexto",
  description: "FIIs de papel, logística, shopping, lajes e híbridos têm riscos diferentes. Comparar por segmento melhora a leitura dos rankings.",
  stats: [
    { label: "Comparação", value: "Mesmo segmento", description: "Ajuda a evitar conclusões distorcidas." },
    { label: "Risco", value: "Diferente", description: "Cada segmento tem fonte de renda e risco próprios." },
    { label: "Ranking", value: "Filtros", description: "Use segmento para refinar análises." },
  ],
  sections: [
    {
      title: "Principais diferenças entre segmentos",
      description: "O segmento influencia vacância, contratos, indexadores, risco de crédito e previsibilidade dos rendimentos.",
      bullets: [
        "FIIs de papel dependem de carteira de CRIs, crédito, indexadores e inadimplência.",
        "FIIs de tijolo dependem de imóveis, locatários, vacância, localização e contratos.",
        "FIIs híbridos combinam estratégias, por isso exigem leitura da carteira e da gestão.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Rankings de FIIs", href: "/rankings", description: "Use filtros de segmento nos rankings." },
    { label: "FIIs com maior Dividend Yield", href: "/rankings/fiis-maior-dividend-yield", description: "Compare rendimentos com filtros de comparação." },
    { label: "FIIs com menor P/VP", href: "/rankings/fiis-menor-pvp", description: "Compare preço e patrimônio." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "Qual segmento de FII é melhor?", answer: "Não existe melhor universal. Cada segmento tem riscos, ciclos e objetivos diferentes." },
    { question: "Posso comparar FII de papel com shopping?", answer: "Pode, mas a comparação direta por DY ou P/VP pode ser enganosa sem contexto." },
  ],
};

export const stockBestHub: HubPageDefinition = {
  slug: "acoes-melhores-acoes",
  path: "/acoes/melhores-acoes",
  metadata: {
    title: "Melhores ações: como filtrar empresas com bons indicadores",
    description: "Entenda como procurar boas ações combinando valuation, rentabilidade, dividendos, setor e contexto dos dados.",
    alternates: { canonical: "/acoes/melhores-acoes" },
  },
  eyebrow: "Guia de ações",
  title: "Melhores ações: como encontrar empresas com bons indicadores",
  description: "Não existe uma melhor ação universal. O objetivo desta página é mostrar como combinar indicadores para montar uma leitura mais confiável.",
  stats: [
    { label: "Preço", value: "P/L e P/VP", description: "Ajuda a entender se o mercado paga caro ou barato pelos fundamentos." },
    { label: "Qualidade", value: "ROE e ROIC", description: "Mostra se a empresa gera retorno com eficiência." },
    { label: "Leitura", value: "Contexto", description: "Ajuda a evitar conclusões fora de contexto." },
  ],
  sections: [
    {
      title: "Como montar um filtro mais inteligente",
      description: "Uma boa triagem combina preço, rentabilidade, crescimento, endividamento, liquidez e setor.",
      bullets: [
        "Compare empresas do mesmo setor antes de concluir que uma ação está barata.",
        "Use ROE, ROIC e margem para evitar focar apenas em múltiplos baixos.",
        "Olhe dividendos com cautela, separando renda recorrente de evento extraordinário.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Ações com maior ROE", href: "/rankings/maiores-roe", description: "Veja rentabilidade sobre patrimônio." },
    { label: "Ações com maior ROIC", href: "/rankings/maiores-roic", description: "Compare retorno sobre capital investido." },
    { label: "Ações com menor P/L", href: "/rankings/menores-pl", description: "Filtre múltiplos de lucro." },
    { label: "Comparador", href: "/comparador", description: "Compare ativos lado a lado." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Existe uma melhor ação para todo investidor?", answer: "Não. O que existe são empresas com características diferentes para objetivos e riscos diferentes." },
    { question: "Ranking substitui análise?", answer: "Não. Ranking é ponto de partida para comparação, não recomendação de investimento." },
  ],
};

export const stockIbovespaHub: HubPageDefinition = {
  slug: "acoes-ibovespa",
  path: "/acoes/ibovespa",
  metadata: {
    title: "Ibovespa: ações, indicadores e contexto para comparar",
    description: "Entenda como usar o Ibovespa como referência e compare ações relevantes por valor de mercado, liquidez e fundamentos.",
    alternates: { canonical: "/acoes/ibovespa" },
  },
  eyebrow: "Ibovespa",
  title: "Ibovespa: use o índice como referência, não como resposta pronta",
  description: "O Ibovespa ajuda a entender as ações mais representativas da bolsa, mas cada empresa precisa ser analisada individualmente.",
  stats: [
    { label: "Referência", value: "Índice", description: "Mostra uma carteira teórica de ações negociadas na B3." },
    { label: "Uso", value: "Contexto", description: "Ajuda a comparar liquidez, porte e setores relevantes." },
    { label: "Cuidado", value: "Peso", description: "Participação no índice não significa qualidade automática." },
  ],
  sections: [
    {
      title: "Como usar o Ibovespa na prática",
      description: "O índice é útil para contexto de mercado, mas não deve substituir análise de fundamentos.",
      bullets: [
        "Compare empresas grandes por valor de mercado, volume e setor.",
        "Observe se o resultado da empresa confirma a relevância de mercado.",
        "Use rankings como triagem e abra a página do ativo para ver fundamentos completos.",
      ],
    },
  ],
  primaryLinks: [
    { label: "Ações com maior valor de mercado", href: "/rankings/maiores-valor-de-mercado", description: "Veja empresas de maior porte." },
    { label: "Ações mais negociadas", href: "/rankings/acoes-mais-negociadas", description: "Compare liquidez e volume." },
    { label: "Diretório de ações", href: "/acoes", description: "Filtre ações por setor e indicadores." },
  ],
  glossaryLinks: commonStockGlossary,
  faq: [
    { question: "Estar no Ibovespa significa ser boa empresa?", answer: "Não. O índice considera critérios de mercado, mas a qualidade precisa ser analisada separadamente." },
    { question: "O Mapa do Ativo recomenda ações do Ibovespa?", answer: "Não. As páginas são educacionais e informativas." },
  ],
};

export const fiiBestHub: HubPageDefinition = {
  slug: "fiis-melhores-fiis",
  path: "/fiis/melhores-fiis",
  metadata: {
    title: "Melhores FIIs: como comparar fundos imobiliários",
    description: "Veja como comparar FIIs usando rendimentos, P/VP, patrimônio, liquidez, segmento e contexto dos dados.",
    alternates: { canonical: "/fiis/melhores-fiis" },
  },
  eyebrow: "Guia de FIIs",
  title: "Melhores FIIs: compare fundos sem olhar só para o rendimento",
  description: "Um bom filtro de FIIs precisa combinar DY, P/VP, patrimônio, liquidez, segmento e cuidado com eventos atípicos.",
  stats: [
    { label: "Renda", value: "DY 12m", description: "Ajuda a enxergar rendimentos recentes." },
    { label: "Preço", value: "P/VP", description: "Compara preço da cota com valor patrimonial." },
    { label: "Contexto", value: "Segmento", description: "Papel, tijolo e híbridos têm riscos diferentes." },
  ],
  sections: [
    {
      title: "Como comparar FIIs com mais segurança",
      description: "O rendimento é importante, mas a qualidade do fundo depende do conjunto.",
      bullets: [
        "Compare FIIs do mesmo segmento para evitar conclusões distorcidas.",
        "Verifique se o rendimento é recorrente ou se veio de amortização/evento extraordinário.",
        "Use patrimônio, liquidez e P/VP para complementar a leitura de DY.",
      ],
    },
  ],
  primaryLinks: [
    { label: "FIIs com maior Dividend Yield", href: "/rankings/fiis-maior-dividend-yield", description: "Ranking com filtros conservadores." },
    { label: "FIIs com menor P/VP", href: "/rankings/fiis-menor-pvp", description: "Compare preço e patrimônio." },
    { label: "FIIs mais negociados", href: "/rankings/fiis-mais-negociados", description: "Veja fundos com maior volume." },
    { label: "Comparador", href: "/comparador", description: "Compare FIIs lado a lado." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "O melhor FII é o que paga mais?", answer: "Não. DY alto pode esconder risco, queda de preço, amortização ou evento não recorrente." },
    { question: "Como começar a comparar FIIs?", answer: "Comece pelo segmento, depois olhe DY, P/VP, patrimônio, liquidez e leitura do conjunto." },
  ],
};

export const fiiIfixHub: HubPageDefinition = {
  slug: "fiis-ifix",
  path: "/fiis/ifix",
  metadata: {
    title: "IFIX: entenda o índice de fundos imobiliários",
    description: "Entenda o IFIX e use rankings de FIIs para comparar rendimentos, P/VP, patrimônio e liquidez com contexto.",
    alternates: { canonical: "/fiis/ifix" },
  },
  eyebrow: "IFIX",
  title: "IFIX: referência para FIIs, não atalho para decisão",
  description: "O IFIX ajuda a acompanhar o mercado de fundos imobiliários, mas cada FII precisa ser analisado por segmento, carteira e rendimentos.",
  stats: [
    { label: "Referência", value: "Índice", description: "Acompanha uma carteira teórica de fundos imobiliários." },
    { label: "Comparação", value: "FIIs", description: "Ajuda a entender liquidez e representatividade." },
    { label: "Análise", value: "Fundos", description: "Cada fundo tem estratégia e risco próprios." },
  ],
  sections: [
    {
      title: "Como usar o IFIX",
      description: "O índice mostra direção geral do mercado, mas não substitui análise dos fundos.",
      bullets: [
        "Use o IFIX como termômetro do segmento de FIIs.",
        "Compare fundos por segmento antes de olhar apenas DY.",
        "Olhe P/VP, liquidez, patrimônio e eventos atípicos para evitar conclusões frágeis.",
      ],
    },
  ],
  primaryLinks: [
    { label: "FIIs com maior patrimônio", href: "/rankings/fiis-maior-patrimonio", description: "Veja fundos maiores da base." },
    { label: "FIIs mais negociados", href: "/rankings/fiis-mais-negociados", description: "Compare liquidez." },
    { label: "Diretório de FIIs", href: "/fiis", description: "Filtre fundos por segmento e indicadores." },
  ],
  glossaryLinks: commonFiiGlossary,
  faq: [
    { question: "IFIX é recomendação?", answer: "Não. É um índice de referência do mercado de FIIs." },
    { question: "Todo FII relevante está no IFIX?", answer: "Não necessariamente. Use o índice como referência e consulte a página do fundo para análise individual." },
  ],
};

export const allHubPages = [
  stockDividendHub,
  stockBestHub,
  stockIbovespaHub,
  stockMarketCapHub,
  stockIndicatorsHub,
  stockSectorsHub,
  fiiRendimentosHub,
  fiiBestHub,
  fiiIfixHub,
  fiiDividendYieldHub,
  fiiPvpHub,
  fiiSegmentsHub,
];
