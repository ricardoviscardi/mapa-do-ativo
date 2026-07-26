from __future__ import annotations

import os
import re
from typing import Any

import requests

from ticker_aliases import resolve_current_ticker

FALLBACK_B3_STOCK_TICKERS = ['AALR3', 'ABCB4', 'ABEV3', 'AERI3', 'AESB3', 'AFLT3', 'AGRO3', 'AGXY3', 'ALLD3', 'ALPA3', 'ALPA4', 'ALUP11', 'ALUP3', 'ALUP4', 'AMAR3', 'AMBP3', 'AMER3', 'ANIM3', 'ARML3', 'ASAI3', 'AURE3', 'AZUL4', 'B3SA3', 'BAUH4', 'BBAS3', 'BBDC3', 'BBDC4', 'BBSE3', 'BEEF3', 'BEES3', 'BEES4', 'BGIP3', 'BGIP4', 'BHIA3', 'BLAU3', 'BMEB3', 'BMEB4', 'BMGB4', 'BMIN3', 'BMIN4', 'BMKS3', 'BPAC11', 'BPAC3', 'BPAC5', 'BPAN4', 'BRAP3', 'BRAP4', 'BRAV3', 'BRBI11', 'MBRF3', 'BRKM3', 'BRKM5', 'BRKM6', 'BRSR3', 'BRSR5', 'BRSR6', 'CAMB3', 'CAML3', 'CASH3', 'CBAV3', 'CEBR3', 'CEBR5', 'CEBR6', 'CEDO3', 'CEDO4', 'CEAB3', 'CGAS3', 'CGAS5', 'CGRA3', 'CGRA4', 'CLSC3', 'CLSC4', 'CMIG3', 'CMIG4', 'CMIN3', 'COCE3', 'COCE5', 'COGN3', 'CPFE3', 'CPLE3', 'CPLE5', 'CPLE6', 'CRFB3', 'CRPG3', 'CRPG5', 'CRPG6', 'CSAN3', 'CSED3', 'CSMG3', 'CSNA3', 'CTKA3', 'CTKA4', 'CTNM3', 'CTNM4', 'CURY3', 'CVCB3', 'CXSE3', 'CYRE3', 'DASA3', 'DESK3', 'DEXP3', 'DEXP4', 'DIRR3', 'DMVF3', 'DOHL3', 'DOHL4', 'DOTZ3', 'DXCO3', 'ECOR3', 'EGIE3', 'AXIA3', 'AXIA6', 'EMBJ3', 'ENEV3', 'ENGI11', 'ENGI3', 'ENGI4', 'ENJU3', 'EQPA3', 'EQPA5', 'EQPA6', 'EQPA7', 'EQTL3', 'ESPA3', 'EVEN3', 'EZTC3', 'FESA3', 'FESA4', 'FHER3', 'FIGE3', 'FIGE4', 'FIQE3', 'FLRY3', 'FRAS3', 'FRIO3', 'GFSA3', 'GGBR3', 'GGBR4', 'GMAT3', 'GOAU3', 'GOAU4', 'GOLL4', 'GRND3', 'HAGA3', 'HAGA4', 'HAPV3', 'HBOR3', 'HBRE3', 'HBSA3', 'HYPE3', 'ICBR3', 'IFCM3', 'IGTI11', 'IGTI3', 'IGTI4', 'INEP3', 'INEP4', 'INTB3', 'IRBR3', 'ITSA3', 'ITSA4', 'ITUB3', 'ITUB4', 'JALL3', 'JFEN3', 'JHSF3', 'JOPA3', 'JOPA4', 'KEPL3', 'KLBN11', 'KLBN3', 'KLBN4', 'LAND3', 'LAVV3', 'LEVE3', 'LJQQ3', 'LOGG3', 'LOGN3', 'LPSB3', 'LREN3', 'LUPA3', 'LWSA3', 'MATD3', 'MBLY3', 'MDIA3', 'MEAL3', 'MELK3', 'MILS3', 'MLAS3', 'MNDL3', 'MNPR3', 'MOAR3', 'MOVI3', 'MBRF3', 'MRVE3', 'MTRE3', 'MTSA4', 'MULT3', 'MYPK3', 'NEOE3', 'NGRD3', 'NATU3', 'ODPV3', 'OFSA3', 'OIBR3', 'OIBR4', 'ONCO3', 'OPCT3', 'ORVR3', 'PCAR3', 'PDGR3', 'PDTC3', 'PETR3', 'PETR4', 'PETZ3', 'PFRM3', 'PINE3', 'PINE4', 'PLAS3', 'PLPL3', 'PMAM3', 'PNVL3', 'POMO3', 'POMO4', 'PORT3', 'POSI3', 'PRIO3', 'PSSA3', 'PTBL3', 'PTNT3', 'PTNT4', 'QUAL3', 'RADL3', 'RAIL3', 'RAIZ4', 'RANI3', 'RAPT3', 'RAPT4', 'RDNI3', 'RDOR3', 'RECV3', 'RENT3', 'RNEW11', 'RNEW3', 'RNEW4', 'ROMI3', 'RPAD3', 'RPAD5', 'RPAD6', 'RRRP3', 'RSID3', 'SANB11', 'SANB3', 'SANB4', 'SAPR11', 'SAPR3', 'SAPR4', 'SBFG3', 'SBSP3', 'SCAR3', 'SEER3', 'SEQL3', 'SHOW3', 'SHUL4', 'SIMH3', 'SLCE3', 'SMFT3', 'SMTO3', 'SNSY3', 'SNSY5', 'SOJA3', 'SRNA3', 'STBP3', 'SUZB3', 'SYNE3', 'TAEE11', 'TAEE3', 'TAEE4', 'TASA3', 'TASA4', 'TECN3', 'TEND3', 'TGMA3', 'TIMS3', 'TKNO4', 'TOTS3', 'TPIS3', 'TRAD3', 'TRIS3', 'TRPL3', 'TRPL4', 'TTEN3', 'TUPY3', 'TXRX3', 'TXRX4', 'UCAS3', 'UGPA3', 'UNIP3', 'UNIP5', 'UNIP6', 'USIM3', 'USIM5', 'VALE3', 'VAMO3', 'VBBR3', 'VIVA3', 'VIVR3', 'VIVT3', 'VLID3', 'VSTE3', 'VTRU3', 'VULC3', 'VVEO3', 'WEGE3', 'WEST3', 'WHRL3', 'WHRL4', 'WIZC3', 'YDUQ3', 'ZAMP3']
UNIT_STOCK_TICKERS = ['ALUP11', 'BPAC11', 'ENGI11', 'IGTI11', 'KLBN11', 'RNEW11', 'SANB11', 'SAPR11', 'TAEE11']

BRAPI_LIST_URL = "https://brapi.dev/api/quote/list"


def normalize_ticker(value: Any) -> str | None:
    text = str(value or "").upper().replace(".SA", "")
    text = re.sub(r"[^A-Z0-9]", "", text)
    if not re.fullmatch(r"[A-Z]{4}[0-9]{1,2}", text):
        return None

    # Exclui a maior parte dos BDRs e FIIs. Units de ações são mantidas por lista.
    if text.endswith(("31", "32", "33", "34", "35", "39")):
        return None
    if text.endswith("11") and text not in UNIT_STOCK_TICKERS:
        return None

    return resolve_current_ticker(text)


def unique(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        ticker = normalize_ticker(value)
        if ticker and ticker not in seen:
            seen.add(ticker)
            out.append(ticker)
    return out


def _extract_symbol(item: dict[str, Any]) -> str | None:
    return normalize_ticker(item.get("stock") or item.get("symbol") or item.get("ticker") or item.get("name"))


def _looks_like_stock(item: dict[str, Any]) -> bool:
    raw = " ".join(str(item.get(key) or "") for key in ["type", "kind", "assetType", "category", "sector"]).lower()
    if any(blocked in raw for blocked in ["fii", "fundo imobili", "etf", "bdr", "índice", "indice"]):
        return False
    return True


def discover_brapi_stock_tickers(limit: int = 2000) -> list[str]:
    token = os.environ.get("BRAPI_API_TOKEN") or os.environ.get("BRAPI_TOKEN")
    if not token:
        return []

    tickers: list[str] = []
    headers = {"Authorization": f"Bearer {token}", "User-Agent": "MapaDoAtivoDataUpdater/1.53.24"}

    for page in range(1, 8):
        params = {"limit": "200", "page": str(page), "sortBy": "name", "sortOrder": "asc"}
        try:
            request_params = dict(params)
            if token:
                request_params["token"] = token
            response = requests.get(BRAPI_LIST_URL, params=request_params, headers=headers, timeout=60)
            if response.status_code >= 400:
                break
            payload = response.json()
        except Exception:
            break

        items = []
        for key in ["stocks", "results", "data", "items", "quotes"]:
            value = payload.get(key) if isinstance(payload, dict) else None
            if isinstance(value, list):
                items.extend(value)

        if not items:
            break

        for item in items:
            if not isinstance(item, dict) or not _looks_like_stock(item):
                continue
            symbol = _extract_symbol(item)
            if symbol:
                tickers.append(symbol)

        if len(items) < 200 or len(tickers) >= limit:
            break

    return unique(tickers)[:limit]


def load_b3_stock_tickers() -> list[str]:
    # Permite sobrescrever por secret/variável sem alterar código.
    custom = os.environ.get("B3_STOCK_TICKERS")
    if custom:
        return unique(re.split(r"[\s,;]+", custom))

    discovered = discover_brapi_stock_tickers()
    if len(discovered) >= 150:
        return discovered

    # Mescla descoberta parcial com fallback amplo. Tickers inválidos ou sem dados
    # são ignorados pelo atualizador e aparecem apenas no relatório.
    return unique([*discovered, *FALLBACK_B3_STOCK_TICKERS])

# Fallback amplo para FIIs quando a descoberta dinâmica da BRAPI falhar ou vier parcial.
# A lista dinâmica via BRAPI é preferida; este fallback evita workflow vazio.
FALLBACK_B3_FII_TICKERS = [
    "ABCP11", "AFHI11", "ALZR11", "ARRI11", "BARI11", "BBFI11", "BBPO11", "BBRC11",
    "BCFF11", "BCIA11", "BCRI11", "BICE11", "BICR11", "BLMG11", "BLMR11", "BLUR11",
    "BMLC11", "BPFF11", "BRCO11", "BRCR11", "BTAL11", "BTLG11", "BTRA11", "BTWR11",
    "CACR11", "CARE11", "CBOP11", "CCME11", "CPTS11", "CVBI11", "CXAG11", "CXCE11",
    "CXCI11", "CXCO11", "CXRI11", "DEVA11", "EURO11", "FAMB11", "FCFL11", "FIIB11",
    "FISC11", "FIVN11", "FLCR11", "FMOF11", "FPAB11", "GALG11", "GAME11", "GCFF11",
    "GCRI11", "GLOG11", "GGRC11", "GTWR11", "HAAA11", "HABT11", "HBRH11", "HCHG11",
    "HCRI11", "HCTR11", "HFOF11", "HGBS11", "HGCR11", "HGFF11", "HGIC11", "HGLG11",
    "HGPO11", "HGRE11", "HGRS11", "HGRU11", "HLOG11", "HOSI11", "HSAF11", "HSLG11",
    "HSML11", "HSRE11", "HTMX11", "HUSC11", "IBCR11", "IRDM11", "JSAF11", "JSRE11",
    "KCRE11", "KFOF11", "KINP11", "KISU11", "KNCA11", "KNCR11", "KNHF11", "KNHY11",
    "KNIP11", "KNRI11", "KNSC11", "KNUQ11", "KORE11", "LASC11", "LFTT11", "LGCP11",
    "LUGG11", "LVBI11", "MALL11", "MANA11", "MATV11", "MCCI11", "MCHF11", "MCHY11",
    "MFII11", "MGCR11", "MINT11", "MORC11", "MORE11", "MXRF11", "NAVT11", "NEWL11",
    "NEWU11", "NSLU11", "OUFF11", "OUJP11", "OULG11", "PATC11", "PATL11", "PLCR11",
    "PORD11", "PQAG11", "PVBI11", "QAGR11", "RBRD11", "RBRF11", "RBRL11", "RBRP11",
    "RBRR11", "RBRS11", "RBRY11", "RBVA11", "RCRB11", "RCRI11", "RECR11", "RECT11",
    "RFOF11", "RMAI11", "RNDP11", "RNGO11", "RRCI11", "RVBI11", "RZAK11", "RZAT11",
    "RZTR11", "SADI11", "SARE11", "SDIL11", "SNAG11", "SNCI11", "SNFF11", "SPTW11",
    "TEPP11", "TGAR11", "TORD11", "TRBL11", "TRXF11", "URPR11", "VCJR11", "VCRI11",
    "VGHF11", "VGIP11", "VGIR11", "VIFI11", "VILG11", "VINO11", "VISC11", "VIUR11",
    "VRTA11", "VSHO11", "VSLH11", "VTLT11", "WHGR11", "XPCI11", "XPCM11", "XPIN11",
    "XPLG11", "XPML11", "XPPR11", "XPSF11", "YUFI11",
]


def normalize_fii_ticker(value: Any) -> str | None:
    text = str(value or "").upper().replace(".SA", "")
    text = re.sub(r"[^A-Z0-9]", "", text)
    # FIIs negociados na B3 normalmente terminam com 11. Excluímos units de ações
    # conhecidas para não misturar ações e fundos.
    if not re.fullmatch(r"[A-Z0-9]{4,6}11", text):
        return None
    if text in UNIT_STOCK_TICKERS:
        return None
    return text


def unique_fiis(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        ticker = normalize_fii_ticker(value)
        if ticker and ticker not in seen:
            seen.add(ticker)
            out.append(ticker)
    return out


def _extract_fii_symbol(item: dict[str, Any]) -> str | None:
    return normalize_fii_ticker(item.get("stock") or item.get("symbol") or item.get("ticker") or item.get("name"))


def _looks_like_fii(item: dict[str, Any]) -> bool:
    raw = " ".join(str(item.get(key) or "") for key in ["type", "kind", "assetType", "category", "sector", "name", "longName", "shortName"]).lower()
    if any(token in raw for token in ["fii", "fundo imobili", "real estate", "reit", "fundos imobili"]):
        return True
    symbol = _extract_fii_symbol(item)
    # Quando a API não traz categoria, aceitamos tickers com padrão de FII.
    return bool(symbol)


def discover_brapi_fii_tickers(limit: int = 3000) -> list[str]:
    token = os.environ.get("BRAPI_API_TOKEN") or os.environ.get("BRAPI_TOKEN")
    if not token:
        return []

    tickers: list[str] = []
    headers = {"Authorization": f"Bearer {token}", "User-Agent": "MapaDoAtivoDataUpdater/1.53.28"}

    for page in range(1, 20):
        params = {"limit": "200", "page": str(page), "sortBy": "name", "sortOrder": "asc", "type": "fund"}
        try:
            request_params = dict(params)
            request_params["token"] = token
            response = requests.get(BRAPI_LIST_URL, params=request_params, headers=headers, timeout=60)
            if response.status_code >= 400:
                # Alguns planos/endpoints ignoram ou rejeitam type=fund. Tenta sem filtro na mesma página.
                request_params.pop("type", None)
                response = requests.get(BRAPI_LIST_URL, params=request_params, headers=headers, timeout=60)
            if response.status_code >= 400:
                break
            payload = response.json()
        except Exception:
            break

        items: list[Any] = []
        for key in ["stocks", "results", "data", "items", "quotes"]:
            value = payload.get(key) if isinstance(payload, dict) else None
            if isinstance(value, list):
                items.extend(value)

        if not items:
            break

        for item in items:
            if not isinstance(item, dict) or not _looks_like_fii(item):
                continue
            symbol = _extract_fii_symbol(item)
            if symbol:
                tickers.append(symbol)

        if len(items) < 200 or len(tickers) >= limit:
            break

    return unique_fiis(tickers)[:limit]


def load_b3_fii_tickers() -> list[str]:
    # Permite sobrescrever por secret/variável com uma lista oficial própria.
    custom = os.environ.get("B3_FII_TICKERS") or os.environ.get("FII_TICKERS")
    if custom:
        return unique_fiis(re.split(r"[\s,;]+", custom))

    discovered = discover_brapi_fii_tickers()
    # Com token BRAPI válido, a lista costuma vir bem acima da base manual.
    if len(discovered) >= 80:
        return discovered

    return unique_fiis([*discovered, *FALLBACK_B3_FII_TICKERS])
