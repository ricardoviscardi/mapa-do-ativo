from __future__ import annotations

from ticker_aliases import resolve_current_ticker

# Camada 1: lista já validada no MVP. Use para atualização rápida diária.
CORE_STOCK_TICKERS = [
    "PETR4", "PETR3", "VALE3", "ITUB4", "ITUB3", "BBAS3", "BBDC4", "BBDC3",
    "BBSE3", "WEGE3", "ABEV3", "TAEE11", "EGIE3", "CSMG3", "RANI3", "CMIG4",
    "CPLE6", "KLBN11", "SUZB3", "RENT3", "MGLU3", "LREN3", "RAIL3", "B3SA3",
]

CORE_FII_TICKERS = [
    "MXRF11", "KNCR11", "CPTS11", "HGLG11", "XPML11", "VISC11", "KNSC11", "RBRR11",
    "HGRU11", "BTLG11", "XPLG11", "KNRI11", "IRDM11", "VGIR11", "RZTR11", "TRXF11",
    "HSML11", "MALL11", "BCFF11", "RBRF11", "PVBI11", "BRCO11", "HGCR11", "RECR11",
    "KNIP11", "KNHY11", "VILG11", "RBRL11", "GGRC11", "LVBI11",
]

# Camada 2: base ampliada para reduzir páginas vazias após publicação.
# Observação: tickers podem mudar ao longo do tempo. O script ignora falhas e gera relatório.
EXPANDED_STOCK_TICKERS = [
    "ABEV3", "ALPA4", "ASAI3", "AURE3", "AZUL4", "B3SA3", "BBAS3", "BBDC3", "BBDC4",
    "BBSE3", "BEEF3", "BPAC11", "BRAP4", "BRFS3", "BRKM5", "BRSR6", "CCRO3", "CMIG3",
    "CMIG4", "CMIN3", "COGN3", "CPFE3", "CPLE3", "CPLE6", "CSAN3", "CSMG3", "CSNA3",
    "CURY3", "CYRE3", "DIRR3", "DXCO3", "ECOR3", "EGIE3", "ELET3", "ELET6", "EMBR3",
    "ENEV3", "ENGI11", "EQTL3", "EVEN3", "EZTC3", "FLRY3", "GGBR4", "GOAU4", "HAPV3",
    "HYPE3", "IRBR3", "ITSA3", "ITSA4", "ITUB3", "ITUB4", "KLBN11", "LEVE3",
    "LREN3", "MDIA3", "MGLU3", "MILS3", "MOVI3", "MRFG3", "MRVE3", "MULT3", "NEOE3",
    "NTCO3", "ODPV3", "PCAR3", "PETR3", "PETR4", "POMO4", "PRIO3", "PSSA3", "RADL3",
    "RAIL3", "RAIZ4", "RANI3", "RDOR3", "RENT3", "ROMI3", "SANB11", "SAPR11", "SBSP3",
    "SLCE3", "SMTO3", "STBP3", "SUZB3", "TAEE11", "TIMS3", "TOTS3", "TRPL4", "UGPA3",
    "USIM5", "VALE3", "VBBR3", "VIVT3", "VIVR3", "VLID3", "WEGE3", "WIZC3", "YDUQ3",
    "ANIM3", "ARZZ3", "BMGB4", "CAML3", "CEAB3", "CEBR6", "DESK3", "ENJU3", "ESPA3", "GFSA3", "HBSA3", "IFCM3", "JHSF3", "KEPL3", "LAVV3", "LOGG3", "LWSA3", "MEAL3", "MELK3", "NGRD3", "OPCT3", "ORVR3", "PETZ3", "PLPL3", "PNVL3", "SEQL3", "SIMH3", "SOJA3", "TEND3", "TRIS3", "TTEN3", "VAMO3", "VIVA3", "VULC3", "WEST3", "ZAMP3",
]

EXPANDED_FII_TICKERS = [
    "ALZR11", "BCFF11", "BCRI11", "BRCO11", "BRCR11", "BTLG11", "CPTS11", "DEVA11",
    "GGRC11", "HCTR11", "HGCR11", "HGPO11", "HGRE11", "HGLG11", "HGRU11", "HSML11",
    "HSLG11", "IRDM11", "JSRE11", "KFOF11", "KNCA11", "KNCR11", "KNHY11", "KNIP11",
    "KNRI11", "KNSC11", "LVBI11", "MALL11", "MCCI11", "MXRF11", "OUJP11", "PVBI11",
    "RBRF11", "RBRL11", "RBRP11", "RBRR11", "RBVA11", "RECR11", "RECT11", "RZTR11",
    "TEPP11", "TRXF11", "URPR11", "VGIR11", "VILG11", "VINO11", "VISC11", "VRTA11",
    "XPIN11", "XPLG11", "XPML11", "XPPR11",
]

def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        normalized = resolve_current_ticker(value)
        if normalized not in seen:
            out.append(normalized)
            seen.add(normalized)
    return out

STOCK_TICKERS = unique([*CORE_STOCK_TICKERS, *EXPANDED_STOCK_TICKERS])
FII_TICKERS = unique([*CORE_FII_TICKERS, *EXPANDED_FII_TICKERS])
UNIT_STOCK_TICKERS = {"ALUP11", "BPAC11", "ENGI11", "IGTI11", "KLBN11", "RNEW11", "SANB11", "SAPR11", "TAEE11"}
CORE_TICKERS = unique([*CORE_STOCK_TICKERS, *CORE_FII_TICKERS])
ALL_TICKERS = unique([*STOCK_TICKERS, *FII_TICKERS])


def yahoo_symbol(ticker: str) -> str:
    return f"{ticker.upper()}.SA"


def kind_for_ticker(ticker: str) -> str:
    normalized = ticker.upper().replace(".SA", "")
    # A lista dinâmica de FIIs da B3 pode trazer tickers que ainda não estão na
    # lista estática. O padrão de negociação de FII é terminar em 11, com exceção
    # das units de ações conhecidas.
    if normalized in FII_TICKERS:
        return "fii"
    if normalized.endswith("11") and normalized not in UNIT_STOCK_TICKERS:
        return "fii"
    return "stock"
