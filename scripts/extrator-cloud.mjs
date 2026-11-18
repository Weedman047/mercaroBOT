import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  ROTAS_PADRAO_KOCH,
  ROTAS_PADRAO_FORT,
  ROTAS_PADRAO_ANGELONI,
  ROTAS_RADAR_KOCH,
  ROTAS_RADAR_FORT,
  ROTAS_RADAR_ANGELONI,
  obterRotasPorCamada
} from "./rotas-mercados.mjs";

const execFileAsync = promisify(execFile);

// =========================================================================
// CONFIGURAÇÃO MULTI-MERCADO: SUPERKOCH (1408) • FORT (1644) • ANGELONI PORTO BELO (28)
// =========================================================================
const MERCADO_ALVO = (
  process.env.MERCADO ||
  (process.argv.includes("--angeloni") ? "angeloni" : (process.argv.includes("--fort") ? "fort" : "koch"))
).toLowerCase();
const EH_FORT = MERCADO_ALVO === "fort";
const EH_ANGELONI = MERCADO_ALVO === "angeloni";
const EH_KOCH = !EH_FORT && !EH_ANGELONI;
const MERCADO_NOME = EH_ANGELONI
  ? "Angeloni (Porto Belo 28)"
  : (EH_FORT ? "Fort Atacadista (Porto Belo 1644)" : "SuperKoch (Itapema 1408)");
const CONTA_ID = EH_ANGELONI ? "superangeloni" : (EH_FORT ? "334" : "295");
const LOJA_ID = EH_ANGELONI ? "28" : (EH_FORT ? "1644" : "1408");
const SITE_URL = EH_ANGELONI
  ? "https://super.angeloni.com.br"
  : (EH_FORT ? "https://www.fortatacadista.com.br" : "https://www.superkoch.com.br");
const GRAPHQL_URL = EH_ANGELONI
  ? "https://super.angeloni.com.br/api/catalog_system/pub/category/tree/3"
  : (EH_FORT ? "https://api.fortatacadista.com.br/storefront/graphql" : "https://api.superkoch.com.br/storefront/graphql");

// Regionalização Oficial VTEX para Angeloni Porto Belo (Loja 28 • BR-101 • CEP 88210-000 / 88220-000)
const ANGELONI_CEP_PORTO_BELO = "88210000";
const ANGELONI_REGION_ID = "v2.DC9332CCEDF88DFCE5B68FFB43DC60CA";
const ANGELONI_DELIVERY_HASH = "27265eb54b4cbc05b1eb0ab9d044902c";
const ANGELONI_PICKUP_HASH = "72781b63183e98f3834d792ea07b989d";
const ANGELONI_SEGMENT_TOKEN = Buffer.from(JSON.stringify({
  campaigns: null,
  channel: "1",
  priceTables: null,
  regionId: ANGELONI_REGION_ID,
  utm_campaign: null,
  utm_source: null,
  utmi_campaign: null,
  currencyCode: "BRL",
  currencySymbol: "R$",
  countryCode: "BRA",
  cultureInfo: "pt-BR",
  channelPrivacy: "public",
  facets: `deliveryZonesHash=${ANGELONI_DELIVERY_HASH};pickupPointsHash=${ANGELONI_PICKUP_HASH};zip-code=${ANGELONI_CEP_PORTO_BELO};country=BRA;coordinates=-48.57570266723633,-27.157468795776367;`
})).toString("base64");

const COOKIE_LOJA_NOME = EH_ANGELONI ? "vtex_segment" : `st_${CONTA_ID}`;
const COOKIE_LOJA_VALOR = EH_ANGELONI
  ? ANGELONI_SEGMENT_TOKEN
  : `%7B%22id%22%3A%22${LOJA_ID}%22%2C%22userSelected%22%3Atrue%7D`;
const COOKIE_LOJA_DOMINIO = EH_ANGELONI
  ? ".angeloni.com.br"
  : (EH_FORT ? ".fortatacadista.com.br" : ".superkoch.com.br");
const DEFAULT_STORE_PATH = EH_ANGELONI
  ? "/api/io/_v/api/intelligent-search/product_search/trade-policy/1"
  : (EH_FORT ? "/334/1644/v2/search" : "/295/1408/v2/search");
const HEADER_TOKEN_NAME = "x-osuper-search-token";

const FIREBASE_BASE = (process.env.FIREBASE_URL || "https://mercaro-e6035-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_SECRET = (process.env.FIREBASE_SECRET || process.env.FIREBASE_AUTH || "").trim();

function authUrl(url) {
  if (!FIREBASE_SECRET) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}auth=${encodeURIComponent(FIREBASE_SECRET)}`;
}

const FIREBASE_ENDPOINT = EH_ANGELONI
  ? `${FIREBASE_BASE}/angeloni_loja_28.json`
  : (EH_FORT ? `${FIREBASE_BASE}/fort_loja_1644.json` : `${FIREBASE_BASE}/koch_loja_1408.json`);
const FIREBASE_TELEMETRIA_ENDPOINT = EH_ANGELONI
  ? `${FIREBASE_BASE}/robo_controle/telemetria_angeloni.json`
  : (EH_FORT ? `${FIREBASE_BASE}/robo_controle/telemetria_fort.json` : `${FIREBASE_BASE}/robo_controle/telemetria_koch.json`);
const FIREBASE_COMANDOS_ENDPOINT = EH_ANGELONI
  ? `${FIREBASE_BASE}/robo_controle/comandos_angeloni.json`
  : (EH_FORT ? `${FIREBASE_BASE}/robo_controle/comandos_fort.json` : `${FIREBASE_BASE}/robo_controle/comandos.json`);
const FIREBASE_FILA_ENDPOINT = EH_ANGELONI
  ? `${FIREBASE_BASE}/robo_controle/fila_custom_angeloni.json`
  : (EH_FORT ? `${FIREBASE_BASE}/robo_controle/fila_custom_fort.json` : `${FIREBASE_BASE}/robo_controle/fila_custom.json`);
const FIREBASE_ENXAME_BASE = EH_ANGELONI
  ? `${FIREBASE_BASE}/robo_controle/enxame_angeloni`
  : (EH_FORT ? `${FIREBASE_BASE}/robo_controle/enxame_fort` : `${FIREBASE_BASE}/robo_controle/enxame_koch`);
const FIREBASE_PESOS_ENDPOINT = EH_ANGELONI
  ? `${FIREBASE_BASE}/robo_controle/pesos_categorias_angeloni.json`
  : (EH_FORT ? `${FIREBASE_BASE}/robo_controle/pesos_categorias_fort.json` : `${FIREBASE_BASE}/robo_controle/pesos_categorias_koch.json`);
const FIREBASE_AGENDAMENTO_ENDPOINT = `${FIREBASE_BASE}/robo_controle/agendamento_auto.json`;
const FIREBASE_VINCULOS_ENDPOINT = `${FIREBASE_BASE}/vinculos_produtos.json`;

// Identificação desta Máquina no Enxame (1 a 10 Máquinas com IPs diferentes)
const WORKER_ID = Math.max(1, Number(process.env.WORKER_ID) || 1);
const TOTAL_WORKERS = Math.max(1, Math.min(10, Number(process.env.TOTAL_WORKERS) || 10));
const SWARM_RUN_ID = process.env.SWARM_RUN_ID || `swarm_${Date.now()}`;
const SOU_MAESTRO = WORKER_ID === 1;

let WORKER_PUBLIC_IP = "Descobrindo...";
async function detectarIpPublico() {
  try {
    const res = await fetch("https://api.ipify.org?format=text", { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      WORKER_PUBLIC_IP = (await res.text()).trim();
      return WORKER_PUBLIC_IP;
    }
  } catch {}
  try {
    const res2 = await fetch("https://icanhazip.com", { signal: AbortSignal.timeout(3000) });
    if (res2.ok) {
      WORKER_PUBLIC_IP = (await res2.text()).trim();
      return WORKER_PUBLIC_IP;
    }
  } catch {}
  WORKER_PUBLIC_IP = `runner-${WORKER_ID}`;
  return WORKER_PUBLIC_IP;
}

// Leitura da Camada de Execução (1 = RADAR, 2 = TURNO 2A, 3 = COMPLETA NOTURNA, 24H = CONTÍNUO 100% DE ONDE PAROU)
const argCamada = process.argv.find((a) => a.startsWith("--camada=") || a.startsWith("--modo="))?.split("=")[1];
const MODO_CAMADA_BRUTO = String(argCamada || process.env.MODO_CAMADA || process.env.MODO_FILA || "2A").toUpperCase();
const EH_MODO_24H = MODO_CAMADA_BRUTO === "24H" || MODO_CAMADA_BRUTO === "CONTINUO" || MODO_CAMADA_BRUTO === "CONTINUO_24H" || MODO_CAMADA_BRUTO === "RADAR" || MODO_CAMADA_BRUTO === "1";
const EH_MODO_RADAR = MODO_CAMADA_BRUTO === "RADAR" || MODO_CAMADA_BRUTO === "1" || MODO_CAMADA_BRUTO === "1A" || MODO_CAMADA_BRUTO === "OFERTAS";

// Configurações Furtivas, Jitter e Otimizações de Rede
// Sense API OSuper (tanto SuperKoch 295 quanto Fort 334) exige size <= 20 ("size must not exceed 20")
const MAX_ALLOWED_SIZE = 20;
const BATCH_SIZE_RAW = Number(process.env.BATCH_SIZE) || 20;
const CONFIG = {
  delayMs: Math.max(450, Number(process.env.DELAY_MS) || (EH_MODO_RADAR ? 900 : 1200)),
  delayTrocaRotaMs: Math.max(800, Number(process.env.DELAY_ROTA_MS) || (EH_MODO_RADAR ? 1400 : 2000)),
  esperaErroRedeMs: 5 * 60 * 1000,
  backoffCurtoMs: 8000,
  size: Math.max(12, Math.min(MAX_ALLOWED_SIZE, BATCH_SIZE_RAW)),
  modoFila: MODO_CAMADA_BRUTO,
  usarProxy: false,
  listaProxies: [],
  salvarAoAdicionar: Math.max(1, Number(process.env.SALVAR_AO_ADICIONAR) || 300),
  salvarAoAtualizar: Math.max(1, Number(process.env.SALVAR_AO_ATUALIZAR) || 100),
  intervaloSavePeriodicoMs: 30 * 60 * 1000, // Salva a cada 30 minutos se houver alterações pendentes
  cooldownSaveMs: Math.max(10000, Number(process.env.COOLDOWN_SAVE_MS) || 25000),
  autoSaveEveryDepto: false,
  startIndex: Math.max(0, (Number(process.env.START_INDEX) || 1) - 1),
  dryRun: String(process.env.DRY_RUN || "false").toLowerCase() === "true"
};

const ROTAS_PADRAO_SEQUENCIAIS = EH_ANGELONI
  ? ROTAS_PADRAO_ANGELONI
  : (EH_FORT ? ROTAS_PADRAO_FORT : ROTAS_PADRAO_KOCH);

function sincronizarIdsOficiaisNasRotas(rotas = []) {
  if (!Array.isArray(rotas)) return rotas;
  const mapaPadraoPorPath = new Map();
  const mapaPadraoPorNome = new Map();
  for (const rPad of ROTAS_PADRAO_SEQUENCIAIS) {
    if (rPad.pathReal) mapaPadraoPorPath.set(rPad.pathReal.toLowerCase(), rPad);
    if (rPad.url) mapaPadraoPorPath.set(rPad.url.toLowerCase(), rPad);
    if (rPad.nome) mapaPadraoPorNome.set(rPad.nome.toLowerCase(), rPad);
  }

  for (const r of rotas) {
    if (!r || r.tipo === "promocoes" || r.tipo === "promocao" || r.tipo === "home" || r.tipo === "categorias_index") {
      if (r && (r.tipo === "promocoes" || r.tipo === "promocao") && !EH_FORT && !EH_ANGELONI) r.id = null;
      continue;
    }
    const refPad = (r.pathReal && mapaPadraoPorPath.get(String(r.pathReal).toLowerCase())) ||
      (r.url && mapaPadraoPorPath.get(String(r.url).toLowerCase())) ||
      (r.nome && mapaPadraoPorNome.get(String(r.nome).toLowerCase()));
    if (refPad) {
      if (refPad.id) r.id = String(refPad.id);
      if (refPad.url) r.url = refPad.url;
      if (refPad.pathReal) r.pathReal = refPad.pathReal;
      if (refPad.hierarquia) r.hierarquia = refPad.hierarquia;
      if (refPad.depto) r.depto = refPad.depto;
    }
  }
  return rotas;
}

async function sincronizarArvoreCategoriasGraphQL(rotas = []) {
  try {
    if (EH_ANGELONI) {
      const resAng = await fetch(GRAPHQL_URL, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          "Cookie": `${COOKIE_LOJA_NOME}=${COOKIE_LOJA_VALOR}`
        },
        signal: AbortSignal.timeout(10000)
      });
      if (!resAng.ok) return false;
      const arvore = await resAng.json();
      if (!Array.isArray(arvore) || arvore.length === 0) return false;

      const mapaVtex = new Map();
      const listaVtexCompleta = [];
      for (const d of arvore) {
        if (!d || !d.id || !d.url || String(d.name || "").startsWith("Z:")) continue;
        let pathD = "";
        try { pathD = new URL(d.url).pathname.toLowerCase(); } catch { continue; }
        const dName = String(d.name || "").trim();
        const objD = {
          id: String(d.id),
          tipo: "depto",
          depto: dName,
          hierarquia: dName,
          nome: `${dName} (Categoria Inteira)`,
          url: `${SITE_URL}${pathD}`,
          pathReal: pathD
        };
        mapaVtex.set(pathD, objD);
        listaVtexCompleta.push(objD);
        if (Array.isArray(d.children)) {
          for (const s of d.children) {
            if (!s || !s.id || !s.url) continue;
            let pathS = "";
            try { pathS = new URL(s.url).pathname.toLowerCase(); } catch { continue; }
            const sName = String(s.name || "").trim();
            const objS = {
              id: String(s.id),
              tipo: "sub",
              depto: dName,
              hierarquia: `${dName} > ${sName}`,
              nome: `${dName} > ${sName}`,
              url: `${SITE_URL}${pathS}`,
              pathReal: pathS
            };
            mapaVtex.set(pathS, objS);
            listaVtexCompleta.push(objS);
          }
        }
      }

      const pathsExistentes = new Set();
      let atualizadas = 0;
      for (const r of rotas) {
        if (!r || !r.pathReal) continue;
        const pLow = String(r.pathReal).toLowerCase();
        pathsExistentes.add(pLow);
        const info = mapaVtex.get(pLow);
        if (info) {
          r.id = info.id;
          r.depto = info.depto;
          r.hierarquia = info.hierarquia;
          r.url = info.url;
          atualizadas++;
        }
      }

      const modoUp = String(CONFIG.modoFila || "").toUpperCase();
      if (modoUp === "COMPLETA" || modoUp === "12H" || modoUp === "3") {
        for (const itemVtex of listaVtexCompleta) {
          if (!pathsExistentes.has(itemVtex.pathReal)) {
            rotas.push({ ...itemVtex });
            pathsExistentes.add(itemVtex.pathReal);
            atualizadas++;
          }
        }
      }
      return atualizadas > 0;
    }

    const queryGql = {
      operationName: "MenuCats",
      variables: { storeId: String(LOJA_ID) },
      query: "query MenuCats($storeId: ID!) { publicViewer(storeId: $storeId) { id menuCategoriesWithPromotional(storeId: $storeId) { id name slug children { id name slug } } } }"
    };
    const res = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Origin": SITE_URL,
        "Referer": `${SITE_URL}/`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      },
      body: JSON.stringify(queryGql),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return false;
    const j = await res.json();
    const deptos = j?.data?.publicViewer?.menuCategoriesWithPromotional;
    if (!Array.isArray(deptos) || deptos.length === 0) return false;

    const mapaGqlPorPath = new Map();
    const listaGqlCompleta = [];
    for (const d of deptos) {
      if (!d || !d.slug || !d.id) continue;
      const dName = String(d.name || "").trim();
      const dSlug = String(d.slug || "").trim().toLowerCase();
      const pathDepto = `/categorias/${dSlug}`;
      const objDepto = {
        id: String(d.id),
        tipo: "depto",
        depto: dName,
        hierarquia: dName,
        nome: `${dName} (Categoria Inteira)`,
        url: `${SITE_URL}${pathDepto}`,
        pathReal: pathDepto
      };
      mapaGqlPorPath.set(pathDepto, objDepto);
      listaGqlCompleta.push(objDepto);
      if (Array.isArray(d.children)) {
        for (const s of d.children) {
          if (!s || !s.slug || !s.id) continue;
          const sName = String(s.name || "").trim();
          const sSlug = String(s.slug || "").trim().toLowerCase();
          const pathSub = `/categorias/${dSlug}/${sSlug}`;
          const objSub = {
            id: String(s.id),
            tipo: "sub",
            depto: dName,
            hierarquia: `${dName} > ${sName}`,
            nome: `${dName} > ${sName}`,
            url: `${SITE_URL}${pathSub}`,
            pathReal: pathSub
          };
          mapaGqlPorPath.set(pathSub, objSub);
          listaGqlCompleta.push(objSub);
        }
      }
    }

    const pathsExistentes = new Set();
    let atualizadas = 0;
    for (const r of rotas) {
      if (!r || !r.pathReal) continue;
      const pLow = String(r.pathReal).toLowerCase();
      pathsExistentes.add(pLow);
      const info = mapaGqlPorPath.get(pLow);
      if (info) {
        r.id = info.id;
        r.depto = info.depto;
        r.hierarquia = info.hierarquia;
        r.url = info.url;
        atualizadas++;
      }
    }

    // No modo COMPLETA (12h), incorpora automaticamente eventuais categorias/subcategorias novas criadas pelo site
    const modoUp = String(CONFIG.modoFila || "").toUpperCase();
    if (modoUp === "COMPLETA" || modoUp === "12H" || modoUp === "3") {
      for (const itemGql of listaGqlCompleta) {
        if (!pathsExistentes.has(itemGql.pathReal)) {
          rotas.push({ ...itemGql });
          pathsExistentes.add(itemGql.pathReal);
          atualizadas++;
        }
      }
    }
    return atualizadas > 0;
  } catch {
    return false;
  }
}

// =========================================================================
// SELETOR DINÂMICO DE FILAS POR CAMADA (24H = MAIS ACESSADOS/PROMO, 2A = 3H AMPLA, COMPLETA = 12H TOTAL)
// =========================================================================
function obterRotasFiltradasPorModo(modo, filaCustom = null) {
  const selecionadas = obterRotasPorCamada(MERCADO_ALVO, modo, filaCustom);
  return sincronizarIdsOficiaisNasRotas(selecionadas);
}

let ROTAS_BASE_MODO = obterRotasFiltradasPorModo(CONFIG.modoFila);
let ROTAS_ATIVAS = [...ROTAS_BASE_MODO];
const mapaPesosCategorias = new Map();

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const dormirHumano = (baseMs) => {
  const jitter = Math.floor(Math.random() * Math.max(500, Math.round(baseMs * 0.4)));
  return dormir(baseMs + jitter);
};
const horaAtualBR = () => new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });

const mapaProdutos = new Map();
const mapaDeltaWorker = new Map();
const dataHojeISO = new Date().toISOString().slice(0, 10);

function atualizarHistoricoSemDuplicarConsecutivos(historicoExistente, dataHoje, precoNovo) {
  const bruto = { ...(historicoExistente || {}) };
  if (precoNovo > 0 && dataHoje) {
    bruto[dataHoje] = Number(precoNovo.toFixed(2));
  }
  const datasOrdenadas = Object.keys(bruto).sort((a, b) => a.localeCompare(b));
  const limpo = {};
  let ultimoPrecoSalvo = null;

  for (const dt of datasOrdenadas) {
    const val = Number(bruto[dt]);
    if (!val || val <= 0) continue;
    const valArred = Number(val.toFixed(2));
    if (ultimoPrecoSalvo === null || Math.abs(valArred - ultimoPrecoSalvo) >= 0.01) {
      limpo[dt] = valArred;
      ultimoPrecoSalvo = valArred;
    }
  }
  return limpo;
}

const sessao = {
  idExecucao: SWARM_RUN_ID,
  workerId: WORKER_ID,
  totalWorkers: TOTAL_WORKERS,
  origem: TOTAL_WORKERS > 1
    ? `Enxame ${MERCADO_NOME} (${TOTAL_WORKERS} Máquinas Paralelas • Modo ${CONFIG.modoFila})`
    : `${MERCADO_NOME} (Contínuo 24h • Modo ${CONFIG.modoFila})`,
  iniciadoEm: new Date().toISOString(),
  iniciadoEmMs: Date.now(),
  tempoInicioMs: Date.now(),
  status: "INICIANDO",
  mensagem: `Carregando e protegendo banco inicial de ${MERCADO_NOME}...`,
  meuIndiceInicio: 0,
  meuIndiceFim: ROTAS_ATIVAS.length - 1,
  rotaIndiceAtual: CONFIG.startIndex,
  rotaTotal: ROTAS_ATIVAS.length,
  rotaNomeAtual: ROTAS_ATIVAS[CONFIG.startIndex]?.nome || "Início",
  rotaUrlAtual: ROTAS_ATIVAS[CONFIG.startIndex]?.url || "",
  deptoAtualNome: ROTAS_ATIVAS[CONFIG.startIndex]?.depto || "Geral",
  paginaAtual: 1,
  totalPaginasEstimadoRota: 1,
  offsetAtual: 0,
  offsetRetomada24h: 0,
  pagRetomada24h: 1,
  pathRetomada24h: "",
  totalInicialFirebase: 0,
  totalAtualNoBanco: 0,
  totalLidosNaSessao: 0,
  novosNaSessao: 0,
  precosAlteradosNaSessao: 0,
  estoquesAlteradosNaSessao: 0,
  atualizadosNaSessao: 0,
  novosDesdeUltimoSave: 0,
  atualizadosDesdeUltimoSave: 0,
  savesRealizados: 0,
  ultimoSaveEm: null,
  ultimoSaveMotivo: "Nenhum ainda",
  ultimoSaveMs: Date.now(),
  requisicoesFeitas: 0,
  ultimosNovos: [],
  ultimosPrecosAlterados: [],
  ultimosEstoquesAlterados: [],
  ultimosLidos: [],
  ultimosLogs: [],
  contagemLogs: { ERRO: 0, AVISO: 0, OK: 0, INESPERADO: 0, ESPERADO: 0 },
  progressoRotas: {},
  pausadoRemoto: false,
  canceladoRemoto: false,
  pularRotaAtual: false,
  irParaRotaIndice: null,
  ultimoComandoIdProcessado: 0,
  indiceProxyAtual: 0,
  minhaFatiaConcluida: false,
  minhasRotasIndices: [],
  minhaCargaEstimadaItens: 0,
  resumoDistribuicaoPlanejada: [],
  agendamentoAuto: {
    ultimaCompleta12hMs: 0,
    ultimaAmpla3hMs: 0,
    ultimoCiclo24hMs: 0
  }
};

function registrarLog(tipo, contexto, mensagem, detalhe = "") {
  const hora = horaAtualBR();
  const tipoNorm = tipo === "ERRO" ? "INESPERADO" : (tipo === "AVISO" ? "ESPERADO" : tipo);
  const tagMercado = EH_ANGELONI ? "ANGELONI" : (EH_FORT ? "FORT" : "KOCH");
  const tagMaq = `[MÁQ #${WORKER_ID}${WORKER_PUBLIC_IP && !WORKER_PUBLIC_IP.startsWith("Desc") ? ` • ${WORKER_PUBLIC_IP}` : ""}]`;
  sessao.ultimosLogs.unshift({
    hora,
    timestamp: Date.now(),
    mercado: tagMercado,
    workerId: WORKER_ID,
    ip: WORKER_PUBLIC_IP,
    tipo: tipoNorm,
    etapa: `${tagMaq} ${contexto}`,
    contexto: `${tagMaq} ${contexto}`,
    mensagem,
    detalhe
  });
  if (sessao.ultimosLogs.length > 250) sessao.ultimosLogs.pop();
  if (sessao.contagemLogs[tipoNorm] !== undefined) sessao.contagemLogs[tipoNorm]++;
  const prefixo = tipoNorm === "INESPERADO" ? "❌" : (tipoNorm === "ESPERADO" ? "⚠️" : "ℹ️");
  console.log(`${prefixo} [${hora}] [${tagMercado}] ${tagMaq} [${contexto}] ${mensagem}${detalhe ? ` (${detalhe})` : ""}`);
}

function formatarDuracaoSeg(segTotal) {
  const s = Math.max(0, Math.round(segTotal));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const seg = s % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(seg).padStart(2, "0")}s`;
  if (m > 0) return `${m}m ${String(seg).padStart(2, "0")}s`;
  return `${seg}s`;
}

function calcularMetricasTempoEProgresso(progressoCombinado = sessao.progressoRotas, maquinasAtivas = 1) {
  const agora = Date.now();
  const decorridoSeg = Math.max(1, Math.round((agora - sessao.tempoInicioMs) / 1000));
  const tempoDecorridoStr = formatarDuracaoSeg(decorridoSeg);

  const pagsRestantesCat = Math.max(0, (sessao.totalPaginasEstimadoRota || 1) - (sessao.paginaAtual || 1));
  const segPorPag = (CONFIG.delayMs * 1.25 + 650) / 1000;
  const estCatSeg = Math.round(pagsRestantesCat * segPorPag);
  const tempoEstimadoCategoriaStr = pagsRestantesCat <= 0
    ? "Finalizando categoria..."
    : `~${formatarDuracaoSeg(estCatSeg)} (faltam ${pagsRestantesCat} págs)`;

  const rotaAtual = ROTAS_ATIVAS[sessao.rotaIndiceAtual] || {};
  const deptoNome = rotaAtual.depto || "Geral";
  const indicesMesmoDepto = [];
  ROTAS_ATIVAS.forEach((r, idx) => {
    if (r.depto === deptoNome) indicesMesmoDepto.push(idx);
  });
  const totalNoDepto = indicesMesmoDepto.length || 1;
  const posNoDepto = Math.max(1, indicesMesmoDepto.indexOf(sessao.rotaIndiceAtual) + 1);
  const faltamNoDepto = Math.max(0, totalNoDepto - posNoDepto);

  let rotasConcluidasTotal = 0;
  for (const k of Object.keys(progressoCombinado || {})) {
    const st = progressoCombinado[k]?.st;
    if (st === "ok" || st === "skip") rotasConcluidasTotal++;
  }
  const totalRotasAtivas = Math.max(1, ROTAS_ATIVAS.length - CONFIG.startIndex);
  const rotasRestantesTotal = Math.max(0, totalRotasAtivas - rotasConcluidasTotal);

  let estTotalSeg = 0;
  const fatorParalelo = Math.max(1, maquinasAtivas);
  if (rotasConcluidasTotal >= 2 && decorridoSeg > 15) {
    const mediaSegPorRotaNoEnxame = decorridoSeg / rotasConcluidasTotal;
    estTotalSeg = Math.round(rotasRestantesTotal * mediaSegPorRotaNoEnxame);
  } else {
    const pagsMediasPorRota = Math.max(2, Math.ceil(96 / CONFIG.size));
    const mediaPadraoRotaSeg = (CONFIG.delayMs * pagsMediasPorRota + CONFIG.delayTrocaRotaMs) / 1000;
    estTotalSeg = Math.round(((rotasRestantesTotal * mediaPadraoRotaSeg) / fatorParalelo) + (estCatSeg / fatorParalelo));
  }

  const tempoRestanteTotalStr = rotasRestantesTotal === 0 && pagsRestantesCat === 0
    ? "Concluído!"
    : `~${formatarDuracaoSeg(estTotalSeg)}`;

  const pctGlobal = Math.min(100, Math.max(1, Math.round((rotasConcluidasTotal / totalRotasAtivas) * 100)));

  return {
    decorridoSeg,
    tempoDecorridoStr,
    estCatSeg,
    tempoEstimadoCategoriaStr,
    estTotalSeg,
    tempoRestanteTotalStr,
    categoriasFaltando: rotasRestantesTotal,
    rotasConcluidasTotal,
    pctGlobal,
    deptoAtualNome: deptoNome,
    subcategoriaPosNoDepto: posNoDepto,
    subcategoriasTotalNoDepto: totalNoDepto,
    subcategoriasFaltandoNoDepto: faltamNoDepto
  };
}

// =========================================================================
// COORDENAÇÃO DO ENXAME DE MÁQUINAS
// =========================================================================
let ultimoEnvioTelemetriaMs = 0;
let ultimaAbsorcaoEnxameMs = 0;
let ultimoEnxameCache = null;
const deltasJaContabilizadosMaestro = new Map();

async function publicarEstadoWorkerNoEnxame() {
  const agora = Date.now();
  const payloadWorker = {
    workerId: WORKER_ID,
    workerIp: WORKER_PUBLIC_IP,
    swarmId: SWARM_RUN_ID,
    mercado: MERCADO_ALVO,
    heartbeatMs: agora,
    status: sessao.status,
    minhaFatiaConcluida: Boolean(sessao.minhaFatiaConcluida),
    mensagem: sessao.mensagem,
    meuIndiceInicio: sessao.meuIndiceInicio,
    meuIndiceFim: sessao.meuIndiceFim,
    rotaIndiceAtual: sessao.rotaIndiceAtual,
    rotaNomeAtual: sessao.rotaNomeAtual,
    deptoAtualNome: sessao.deptoAtualNome,
    paginaAtual: sessao.paginaAtual,
    totalPaginasEstimadoRota: sessao.totalPaginasEstimadoRota,
    offsetAtual: sessao.offsetAtual,
    totalLidosNaSessao: sessao.totalLidosNaSessao,
    novosNaSessao: sessao.novosNaSessao,
    precosAlteradosNaSessao: sessao.precosAlteradosNaSessao,
    estoquesAlteradosNaSessao: sessao.estoquesAlteradosNaSessao,
    requisicoesFeitas: sessao.requisicoesFeitas,
    progressoRotas: sessao.progressoRotas,
    ultimosNovos: sessao.ultimosNovos.slice(0, 25),
    ultimosPrecosAlterados: sessao.ultimosPrecosAlterados.slice(0, 30),
    ultimosLidos: sessao.ultimosLidos.slice(0, 8),
    ultimosLogs: sessao.ultimosLogs.slice(0, 50),
    produtosDelta: Array.from(mapaDeltaWorker.values())
  };

  try {
    await fetch(authUrl(`${FIREBASE_ENXAME_BASE}/worker_${WORKER_ID}.json`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWorker)
    });
  } catch {}
}

async function absorverEnxameNoMaestro(forcarLeituraRede = false) {
  if (TOTAL_WORKERS <= 1) {
    return {
      maquinasAtivas: 1,
      todosConcluidos: Boolean(sessao.minhaFatiaConcluida || sessao.status === "CONCLUIDO" || sessao.status === "CANCELADO_SALVO"),
      totalLidosGlobal: sessao.totalLidosNaSessao,
      novosGlobal: sessao.novosNaSessao,
      precosGlobal: sessao.precosAlteradosNaSessao,
      estoquesGlobal: sessao.estoquesAlteradosNaSessao,
      reqsGlobal: sessao.requisicoesFeitas,
      progressoCombinado: { ...sessao.progressoRotas },
      novosListaCombinada: sessao.ultimosNovos.slice(0, 50),
      precosListaCombinada: sessao.ultimosPrecosAlterados.slice(0, 60),
      lidosListaCombinada: sessao.ultimosLidos.slice(0, 10),
      logsCombinados: sessao.ultimosLogs.slice(0, 150),
      resumoMaquinas: [{
        id: 1,
        ip: WORKER_PUBLIC_IP,
        mercado: MERCADO_ALVO,
        status: sessao.status,
        rota: `#${sessao.rotaIndiceAtual + 1} ${sessao.rotaNomeAtual}`,
        depto: sessao.deptoAtualNome || "Geral",
        pag: sessao.paginaAtual,
        offset: sessao.offsetAtual,
        lidos: sessao.totalLidosNaSessao,
        novos: sessao.novosNaSessao,
        precos: sessao.precosAlteradosNaSessao,
        reqs: sessao.requisicoesFeitas,
        heartbeatMs: Date.now()
      }]
    };
  }

  const agoraMs = Date.now();
  if (!forcarLeituraRede && ultimoEnxameCache && (agoraMs - ultimaAbsorcaoEnxameMs < 7500)) {
    return ultimoEnxameCache;
  }
  ultimaAbsorcaoEnxameMs = agoraMs;

  let enxameDados = {};
  try {
    const r = await fetch(authUrl(`${FIREBASE_ENXAME_BASE}.json`));
    if (r.ok) enxameDados = (await r.json()) || {};
  } catch {}

  let totalLidosGlobal = sessao.totalLidosNaSessao;
  let novosGlobal = sessao.novosNaSessao;
  let precosGlobal = sessao.precosAlteradosNaSessao;
  let estoquesGlobal = sessao.estoquesAlteradosNaSessao;
  let reqsGlobal = sessao.requisicoesFeitas;
  const progressoCombinado = { ...sessao.progressoRotas };
  const novosMap = new Map();
  const precosMap = new Map();
  const lidosCombinados = [...sessao.ultimosLidos];
  const logsCombinados = [...sessao.ultimosLogs];

  const maestroFinalizado = Boolean(sessao.minhaFatiaConcluida || sessao.status === "CONCLUIDO" || sessao.status === "CANCELADO_SALVO");

  const resumoMaquinas = [{
    id: 1,
    ip: WORKER_PUBLIC_IP,
    mercado: MERCADO_ALVO,
    status: maestroFinalizado && sessao.status === "RODANDO" ? "AGUARDANDO_ENXAME" : sessao.status,
    rota: `#${sessao.rotaIndiceAtual + 1} ${sessao.rotaNomeAtual}`,
    depto: sessao.deptoAtualNome || "Geral",
    pag: sessao.paginaAtual,
    offset: sessao.offsetAtual,
    lidos: sessao.totalLidosNaSessao,
    novos: sessao.novosNaSessao,
    precos: sessao.precosAlteradosNaSessao,
    reqs: sessao.requisicoesFeitas,
    heartbeatMs: agoraMs
  }];

  sessao.ultimosNovos.forEach((n) => novosMap.set(n.id, n));
  sessao.ultimosPrecosAlterados.forEach((p) => precosMap.set(p.id, p));

  let maquinasAtivas = (!maestroFinalizado && (sessao.status === "RODANDO" || sessao.status === "BLOQUEIO_ESPERA")) ? 1 : 0;
  let workersFinalizados = maestroFinalizado ? 1 : 0;
  let workersVistos = 1;

  for (let w = 2; w <= TOTAL_WORKERS; w++) {
    const wk = enxameDados[`worker_${w}`];
    if (!wk || wk.swarmId !== SWARM_RUN_ID) continue;
    workersVistos++;

    const idadeMs = agoraMs - Number(wk.heartbeatMs || 0);
    const wkConcluiu = wk.status === "CONCLUIDO" || wk.status === "CANCELADO_SALVO" || Boolean(wk.minhaFatiaConcluida);
    const ativo = !wkConcluiu && (wk.status === "RODANDO" || wk.status === "BLOQUEIO_ESPERA" || wk.status === "INICIANDO") && idadeMs < 150000;
    if (ativo) maquinasAtivas++;
    if (wkConcluiu || idadeMs >= 180000) {
      workersFinalizados++;
    }

    totalLidosGlobal += Number(wk.totalLidosNaSessao || 0);
    novosGlobal += Number(wk.novosNaSessao || 0);
    precosGlobal += Number(wk.precosAlteradosNaSessao || 0);
    estoquesGlobal += Number(wk.estoquesAlteradosNaSessao || 0);
    reqsGlobal += Number(wk.requisicoesFeitas || 0);

    if (wk.progressoRotas && typeof wk.progressoRotas === "object") {
      Object.assign(progressoCombinado, wk.progressoRotas);
    }
    if (Array.isArray(wk.ultimosNovos)) {
      wk.ultimosNovos.forEach((n) => { if (n?.id && !novosMap.has(n.id)) novosMap.set(n.id, n); });
    }
    if (Array.isArray(wk.ultimosPrecosAlterados)) {
      wk.ultimosPrecosAlterados.forEach((p) => { if (p?.id && !precosMap.has(p.id)) precosMap.set(p.id, p); });
    }
    if (Array.isArray(wk.ultimosLidos)) {
      wk.ultimosLidos.forEach((txt) => { if (txt && !lidosCombinados.includes(txt)) lidosCombinados.push(txt); });
    }
    if (Array.isArray(wk.ultimosLogs)) {
      wk.ultimosLogs.forEach((lg) => { if (lg) logsCombinados.push(lg); });
    }

    if (Array.isArray(wk.produtosDelta)) {
      for (const prodW of wk.produtosDelta) {
        if (!prodW || !prodW.id) continue;
        // Chave por worker + produto sem contar tamanho de array de categorias (evita ping-pong entre máquinas!)
        const chaveWorkerProd = `${w}_${prodW.id}`;
        const hashW = `${Number(prodW.preco || 0).toFixed(2)}_${Number(prodW.estoque ?? 0)}`;
        if (deltasJaContabilizadosMaestro.get(chaveWorkerProd) === hashW) {
          continue;
        }
        deltasJaContabilizadosMaestro.set(chaveWorkerProd, hashW);

        const existenteMestre = mapaProdutos.get(prodW.id);
        if (!existenteMestre) {
          mapaProdutos.set(prodW.id, prodW);
          sessao.novosDesdeUltimoSave++;
        } else {
          const precoMestre = Number(existenteMestre.preco || 0);
          const precoWorker = Number(prodW.preco || precoMestre);
          const estMestre = Number(existenteMestre.estoque ?? 0);
          const estWorker = Number(prodW.estoque ?? estMestre);
          const mudouRealmente = Math.abs(precoMestre - precoWorker) >= 0.01 || estMestre !== estWorker;

          const catsUnidas = Array.from(new Set([...(existenteMestre.categorias || []), ...(prodW.categorias || [])]));
          const histUnido = atualizarHistoricoSemDuplicarConsecutivos(
            { ...(existenteMestre.historicoPrecos || {}), ...(prodW.historicoPrecos || {}) },
            dataHojeISO,
            precoWorker
          );
          mapaProdutos.set(prodW.id, {
            ...existenteMestre,
            ...prodW,
            categorias: catsUnidas,
            historicoPrecos: histUnido,
            atualizadoEm: prodW.atualizadoEm || new Date().toISOString()
          });
          if (mudouRealmente) {
            sessao.atualizadosDesdeUltimoSave++;
          }
        }
      }
    }

    resumoMaquinas.push({
      id: w,
      ip: wk.workerIp || `Máquina-${w}`,
      mercado: MERCADO_ALVO,
      status: wk.status,
      rota: `#${(wk.rotaIndiceAtual || 0) + 1} ${wk.rotaNomeAtual || ""}`,
      depto: wk.deptoAtualNome || "Geral",
      pag: wk.paginaAtual || 1,
      offset: wk.offsetAtual || 0,
      lidos: wk.totalLidosNaSessao || 0,
      novos: wk.novosNaSessao || 0,
      precos: wk.precosAlteradosNaSessao || 0,
      reqs: wk.requisicoesFeitas || 0,
      heartbeatMs: wk.heartbeatMs || agoraMs
    });
  }

  sessao.totalAtualNoBanco = mapaProdutos.size;
  const decorridoMs = agoraMs - sessao.tempoInicioMs;
  const todosConcluidos = maestroFinalizado && (
    (workersVistos >= TOTAL_WORKERS && workersFinalizados >= TOTAL_WORKERS) ||
    (maquinasAtivas === 0 && workersFinalizados >= workersVistos && decorridoMs > 75000)
  );

  logsCombinados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  ultimoEnxameCache = {
    maquinasAtivas: Math.max(maestroFinalizado ? 0 : 1, maquinasAtivas),
    todosConcluidos,
    totalLidosGlobal,
    novosGlobal,
    precosGlobal,
    estoquesGlobal,
    reqsGlobal,
    progressoCombinado,
    novosListaCombinada: Array.from(novosMap.values()).slice(0, 50),
    precosListaCombinada: Array.from(precosMap.values()).slice(0, 60),
    lidosListaCombinada: lidosCombinados.slice(0, 10),
    logsCombinados: logsCombinados.slice(0, 200),
    resumoMaquinas
  };
  return ultimoEnxameCache;
}

async function enviarTelemetriaAoVivo(forcar = false) {
  const agora = Date.now();
  if (!forcar && agora - ultimoEnvioTelemetriaMs < 2800) return;
  ultimoEnvioTelemetriaMs = agora;

  if (!SOU_MAESTRO) {
    await publicarEstadoWorkerNoEnxame();
    return;
  }

  await publicarEstadoWorkerNoEnxame();
  const enxame = await absorverEnxameNoMaestro();
  const metricas = calcularMetricasTempoEProgresso(enxame.progressoCombinado, enxame.maquinasAtivas);

  const msgVivaUnificada = TOTAL_WORKERS > 1 && sessao.status === "RODANDO"
    ? `⚡ Enxame Ativo (${enxame.maquinasAtivas}/${TOTAL_WORKERS} Máquinas c/ IPs próprios) • ${sessao.mensagem}`
    : sessao.mensagem;

  const payload = {
    idExecucao: sessao.idExecucao,
    mercado: MERCADO_ALVO,
    mercadoNome: MERCADO_NOME,
    lojaId: LOJA_ID,
    origem: sessao.origem,
    iniciadoEm: sessao.iniciadoEm,
    iniciadoEmMs: sessao.tempoInicioMs,
    tempoInicioMs: sessao.tempoInicioMs,
    atualizadoEm: new Date().toISOString(),
    heartbeatMs: agora,
    status: sessao.status,
    mensagem: msgVivaUnificada,
    progressoPct: sessao.status === "CONCLUIDO" ? 100 : metricas.pctGlobal,
    tempoDecorrido: metricas.tempoDecorridoStr,
    tempoEstimadoCategoria: metricas.tempoEstimadoCategoriaStr,
    tempoRestante: sessao.status === "CONCLUIDO" ? "Concluído!" : metricas.tempoRestanteTotalStr,
    rotaIndiceAtual: sessao.rotaIndiceAtual + 1,
    rotaTotal: ROTAS_ATIVAS.length,
    categoriasFaltando: metricas.categoriasFaltando,
    rotaNomeAtual: sessao.rotaNomeAtual,
    rotaUrlAtual: sessao.rotaUrlAtual,
    deptoAtualNome: metricas.deptoAtualNome,
    subcategoriaPosNoDepto: metricas.subcategoriaPosNoDepto,
    subcategoriasTotalNoDepto: metricas.subcategoriasTotalNoDepto,
    subcategoriasFaltandoNoDepto: metricas.subcategoriasFaltandoNoDepto,
    paginaAtual: sessao.paginaAtual,
    totalPaginasEstimadoRota: sessao.totalPaginasEstimadoRota,
    offsetAtual: sessao.offsetAtual,
    totalInicialFirebase: sessao.totalInicialFirebase,
    totalAtualNoBanco: mapaProdutos.size,
    totalLidosNaSessao: enxame.totalLidosGlobal,
    novosNaSessao: enxame.novosGlobal,
    precosAlteradosNaSessao: enxame.precosGlobal,
    estoquesAlteradosNaSessao: enxame.estoquesGlobal,
    atualizadosNaSessao: enxame.precosGlobal + enxame.estoquesGlobal,
    novosDesdeUltimoSave: sessao.novosDesdeUltimoSave,
    atualizadosDesdeUltimoSave: sessao.atualizadosDesdeUltimoSave,
    savesRealizados: sessao.savesRealizados,
    ultimoSaveEm: sessao.ultimoSaveEm,
    ultimoSaveMotivo: sessao.ultimoSaveMotivo,
    requisicoesFeitas: enxame.reqsGlobal,
    enxameAtivo: {
      totalMaquinas: TOTAL_WORKERS,
      maquinasAtivas: enxame.maquinasAtivas,
      resumoMaquinas: enxame.resumoMaquinas,
      distribuicaoPlanejada: sessao.resumoDistribuicaoPlanejada || [],
      secoesMaisItensTop15: Array.from(mapaPesosCategorias.values())
        .sort((a, b) => Number(b.totalItens || 0) - Number(a.totalItens || 0))
        .slice(0, 15)
    },
    configAtiva: {
      totalMaquinas: TOTAL_WORKERS,
      modoFila: CONFIG.modoFila,
      size: CONFIG.size,
      usarProxy: CONFIG.usarProxy,
      delayMs: CONFIG.delayMs,
      delayTrocaRotaMs: CONFIG.delayTrocaRotaMs,
      salvarAoAdicionar: CONFIG.salvarAoAdicionar,
      salvarAoAtualizar: CONFIG.salvarAoAtualizar,
      cooldownSaveMs: CONFIG.cooldownSaveMs
    },
    ultimosNovos: enxame.novosListaCombinada,
    ultimosPrecosAlterados: enxame.precosListaCombinada,
    ultimosEstoquesAlterados: sessao.ultimosEstoquesAlterados.slice(0, 30),
    ultimosLidos: enxame.lidosListaCombinada,
    ultimosLogs: enxame.logsCombinados,
    contagemLogs: sessao.contagemLogs,
    progressoRotas: enxame.progressoCombinado
  };

  try {
    await fetch(authUrl(FIREBASE_TELEMETRIA_ENDPOINT), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    // Se for SuperKoch, mantém telemetria.json sincronizado para retrocompatibilidade
    if (EH_KOCH) {
      await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/telemetria.json`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {});
    }
  } catch {}
}

let ultimaLeituraComandosMs = 0;
async function verificarComandosRemotos(forcar = false) {
  const agora = Date.now();
  if (!forcar && agora - ultimaLeituraComandosMs < 2200) return;
  ultimaLeituraComandosMs = agora;

  try {
    const resp = await fetch(authUrl(`${FIREBASE_COMANDOS_ENDPOINT}?t=${agora}`));
    if (!resp.ok) return;
    const cmd = await resp.json();
    if (!cmd || typeof cmd !== "object") return;

    if (cmd.config && typeof cmd.config === "object") {
      if (Number(cmd.config.delayMs) >= 600) CONFIG.delayMs = Number(cmd.config.delayMs);
      if (Number(cmd.config.delayTrocaRotaMs) >= 1000) CONFIG.delayTrocaRotaMs = Number(cmd.config.delayTrocaRotaMs);
      if (Number(cmd.config.salvarAoAdicionar) >= 1) CONFIG.salvarAoAdicionar = Number(cmd.config.salvarAoAdicionar);
      if (Number(cmd.config.salvarAoAtualizar) >= 1) CONFIG.salvarAoAtualizar = Number(cmd.config.salvarAoAtualizar);
      if (Number(cmd.config.cooldownSaveMs) >= 5000) CONFIG.cooldownSaveMs = Number(cmd.config.cooldownSaveMs);
      if (Number(cmd.config.size) >= 12) CONFIG.size = Math.min(MAX_ALLOWED_SIZE, Number(cmd.config.size));
      if (typeof cmd.config.usarProxy === "boolean") CONFIG.usarProxy = cmd.config.usarProxy;
      if (Array.isArray(cmd.config.listaProxies)) CONFIG.listaProxies = cmd.config.listaProxies.filter(Boolean);
    }

    const cmdId = Number(cmd.id || cmd.timestamp || 0);
    if (!cmdId || cmdId <= sessao.ultimoComandoIdProcessado) return;
    sessao.ultimoComandoIdProcessado = cmdId;

    const acao = String(cmd.acao || "").toUpperCase();
    registrarLog("OK", "Controle Remoto", `Comando recebido do painel: ${acao}`);

    if (acao === "PAUSAR") {
      sessao.pausadoRemoto = true;
      sessao.status = "PAUSADO";
      sessao.mensagem = `⏸ Pausado pelo controle remoto em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Progresso salvo!`;
      if (SOU_MAESTRO) await gravarComSegurancaNoFirebase("Salvo ao Pausar pelo Painel");
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "RETOMAR") {
      sessao.pausadoRemoto = false;
      sessao.status = "RODANDO";
      sessao.mensagem = `▶ Retomando execução em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual})...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "SALVAR_AGORA") {
      sessao.mensagem = `💾 Salvamento manual solicitado pelo painel...`;
      await enviarTelemetriaAoVivo(true);
      if (SOU_MAESTRO) await gravarComSegurancaNoFirebase("Salvo Manualmente pelo Painel");
    } else if (acao === "PULAR_ROTA") {
      sessao.pularRotaAtual = true;
      sessao.pausadoRemoto = false;
      sessao.mensagem = `⏭ Pulando categoria ${sessao.rotaNomeAtual} por comando remoto...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "IR_PARA_ROTA" && Number(cmd.rotaNumero) >= 1 && Number(cmd.rotaNumero) <= ROTAS_ATIVAS.length) {
      sessao.irParaRotaIndice = Number(cmd.rotaNumero) - 1;
      sessao.pularRotaAtual = true;
      sessao.pausadoRemoto = false;
      sessao.mensagem = `🎯 Indo para categoria #${cmd.rotaNumero} (${ROTAS_ATIVAS[sessao.irParaRotaIndice]?.nome})...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "ATUALIZAR_FILA" && Array.isArray(cmd.rotas) && cmd.rotas.length > 0) {
      ROTAS_BASE_MODO = sincronizarIdsOficiaisNasRotas(cmd.rotas);
      recalcularFatiaDoWorker();

  if (SOU_MAESTRO) {
    await salvarPesosCategoriasNoFirebase(sessao.progressoRotas);
  }
      registrarLog("OK", "Fila", `Fila atualizada remotamente pelo painel (${ROTAS_ATIVAS.length} tarefas/fatias).`);
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "RESETAR_FILA") {
      ROTAS_BASE_MODO = obterRotasFiltradasPorModo(CONFIG.modoFila);
      recalcularFatiaDoWorker();

  if (SOU_MAESTRO) {
    await salvarPesosCategoriasNoFirebase(sessao.progressoRotas);
  }
      sessao.irParaRotaIndice = sessao.meuIndiceInicio;
      sessao.pularRotaAtual = true;
      sessao.progressoRotas = {};
      registrarLog("OK", "Fila", `Fila restaurada (${ROTAS_ATIVAS.length} tarefas/fatias no modo ${CONFIG.modoFila}).`);
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "CANCELAR") {
      sessao.canceladoRemoto = true;
      sessao.pausadoRemoto = false;
      sessao.status = "CANCELADO_SALVO";
      sessao.mensagem = `⏹ Parado pelo usuário em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Salvando tudo no Firebase...`;
      await enviarTelemetriaAoVivo(true);
      if (SOU_MAESTRO) {
        await dormir(2500);
        await absorverEnxameNoMaestro();
        await gravarComSegurancaNoFirebase(`Parado pelo Painel em ${sessao.rotaNomeAtual}`);
        await enviarTelemetriaAoVivo(true);
      }
      process.exit(0);
    }
  } catch {}
}

async function aguardarSePausadoRemoto() {
  let contadorPausa = 0;
  while (sessao.pausadoRemoto && !sessao.canceladoRemoto) {
    contadorPausa++;
    if (contadorPausa % 4 === 0) {
      sessao.status = "PAUSADO";
      await enviarTelemetriaAoVivo(false);
    }
    await verificarComandosRemotos(true);
    await dormir(1500);
  }
}

async function persistirTokenFirebase(tk) {
  if (!tk || !FIREBASE_BASE) return;
  try {
    const payload = {
      token: tk,
      atualizadoEm: new Date().toISOString(),
      mercado: MERCADO_ALVO,
      lojaId: LOJA_ID
    };
    await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/tokens/${MERCADO_ALVO}.json`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {}
}

// =========================================================================
// INTELIGÊNCIA ADAPTATIVA DE PESOS POR SEÇÃO E DISTRIBUIÇÃO MULTI-MÁQUINAS
// =========================================================================
function chaveCategoriaRota(rota) {
  if (!rota) return "";
  if (rota.tipo === "promocoes" || rota.tipo === "promocao" || String(rota.pathReal || "").toLowerCase() === "/promocoes") {
    return "/promocoes";
  }
  if (rota.pathReal) return String(rota.pathReal).toLowerCase().trim();
  if (rota.url) {
    try {
      const u = new URL(rota.url);
      if (u.pathname) return u.pathname.toLowerCase().trim();
    } catch {}
  }
  return String(rota.nomeBase || rota.nome || "").toLowerCase().trim();
}

function popularPesosIniciaisPeloCatalogo() {
  if (mapaProdutos.size === 0) return;
  let totalPromos = 0;
  const contagemPorDepto = new Map();
  const contagemPorCat = new Map();

  for (const p of mapaProdutos.values()) {
    if (!p) continue;
    if (p.emPromocao || (Number(p.precoOriginal) > Number(p.preco) && Number(p.preco) > 0)) {
      totalPromos++;
    }
    if (Array.isArray(p.categorias)) {
      const vistosDepto = new Set();
      for (const c of p.categorias) {
        const cStr = String(c || "").trim();
        if (!cStr) continue;
        const cLow = cStr.toLowerCase();
        contagemPorCat.set(cLow, (contagemPorCat.get(cLow) || 0) + 1);
        const raiz = cLow.split(">")[0].trim();
        if (raiz && !vistosDepto.has(raiz)) {
          vistosDepto.add(raiz);
          contagemPorDepto.set(raiz, (contagemPorDepto.get(raiz) || 0) + 1);
        }
      }
    }
  }

  for (const r of ROTAS_PADRAO_SEQUENCIAIS) {
    const ch = chaveCategoriaRota(r);
    if (!ch || mapaPesosCategorias.has(ch)) continue;
    let qtd = 0;
    if (r.tipo === "promocoes" || r.tipo === "promocao" || ch === "/promocoes") {
      qtd = Math.max(200, totalPromos);
    } else if (r.tipo === "depto") {
      const dLow = String(r.depto || r.hierarquia || "").toLowerCase().trim();
      qtd = contagemPorDepto.get(dLow) || contagemPorCat.get(dLow) || 400;
    } else {
      const hLow = String(r.hierarquia || r.nome || "").toLowerCase().trim();
      const subLow = hLow.includes(">") ? hLow.split(">").pop().trim() : hLow;
      qtd = contagemPorCat.get(hLow) || contagemPorCat.get(subLow) || 80;
    }
    qtd = Math.max(20, qtd);
    mapaPesosCategorias.set(ch, {
      pathReal: ch,
      nome: r.nomeBase || r.nome,
      depto: r.depto || "Geral",
      tipo: r.tipo || "sub",
      totalItens: qtd,
      paginas: Math.max(1, Math.ceil(qtd / CONFIG.size)),
      origem: "catalogo_firebase",
      atualizadoEm: new Date().toISOString()
    });
  }
}

function obterPesoCategoria(rota) {
  const ch = chaveCategoriaRota(rota);
  const salvo = ch ? mapaPesosCategorias.get(ch) : null;
  if (salvo && Number(salvo.totalItens) > 0) {
    return Math.max(20, Number(salvo.totalItens));
  }
  if (rota?.tipo === "promocoes" || rota?.tipo === "promocao") return 1400;
  if (rota?.tipo === "depto") return 600;
  return 100;
}

async function salvarPesosCategoriasNoFirebase(progressoCombinado = sessao.progressoRotas) {
  if (!SOU_MAESTRO || !FIREBASE_BASE || CONFIG.dryRun) return;
  try {
    const agrupadoPorPath = new Map();
    for (const info of Object.values(progressoCombinado || {})) {
      if (!info) continue;
      const ch = chaveCategoriaRota(info);
      if (!ch) continue;
      if (!agrupadoPorPath.has(ch)) {
        agrupadoPorPath.set(ch, {
          pathReal: ch,
          nome: info.nomeBase || String(info.nome || "").replace(/\s*\[Máq\s+\d+\/\d+.*$/i, "").trim(),
          depto: info.depto || "Geral",
          tipo: info.tipo || "sub",
          somaLidos: 0,
          maxTotalSite: 0,
          algumaConcluida: false
        });
      }
      const g = agrupadoPorPath.get(ch);
      g.somaLidos += Number(info.lidos || 0);
      if (Number(info.totalCategoriaSite || 0) > g.maxTotalSite) {
        g.maxTotalSite = Number(info.totalCategoriaSite);
      }
      if (info.st === "ok") g.algumaConcluida = true;
    }

    for (const [ch, g] of agrupadoPorPath.entries()) {
      const totalMedido = g.maxTotalSite > 0 ? Math.max(g.maxTotalSite, g.somaLidos) : g.somaLidos;
      if (totalMedido > 0 && (g.algumaConcluida || g.maxTotalSite > 0)) {
        mapaPesosCategorias.set(ch, {
          pathReal: ch,
          nome: g.nome || ch,
          depto: g.depto || "Geral",
          tipo: g.tipo || "sub",
          totalItens: totalMedido,
          paginas: Math.max(1, Math.ceil(totalMedido / CONFIG.size)),
          origem: "verificacao_site",
          atualizadoEm: new Date().toISOString()
        });
      }
    }

    const rankingSecoes = Array.from(mapaPesosCategorias.values())
      .filter((x) => x && Number(x.totalItens) > 0)
      .sort((a, b) => Number(b.totalItens) - Number(a.totalItens));

    const mapaPorPath = {};
    for (const item of rankingSecoes) {
      const chaveFbSegura = String(item.pathReal || "")
        .replace(/^\/+/, "")
        .replace(/[/.#$[\]]/g, "__") || "geral";
      mapaPorPath[chaveFbSegura] = item;
    }

    const payloadPesos = {
      mercado: MERCADO_ALVO,
      mercadoNome: MERCADO_NOME,
      lojaId: LOJA_ID,
      atualizadoEm: new Date().toISOString(),
      totalSecoesMapeadas: rankingSecoes.length,
      secoesMaisItensTop15: rankingSecoes.slice(0, 15),
      distribuicaoUltimaExecucao: sessao.resumoDistribuicaoPlanejada || [],
      rankingSecoes,
      mapaPorPath
    };

    await fetch(authUrl(FIREBASE_PESOS_ENDPOINT), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadPesos)
    });
  } catch {}
}

async function registrarAgendamentoAutoNoFirebase(etapa = "inicio") {
  if (!SOU_MAESTRO || !FIREBASE_BASE || CONFIG.dryRun) return;
  try {
    const agoraMs = Date.now();
    const agoraISO = new Date(agoraMs).toISOString();
    const resAt = await fetch(authUrl(FIREBASE_AGENDAMENTO_ENDPOINT)).catch(() => null);
    const atual = (resAt && resAt.ok ? await resAt.json().catch(() => null) : null) || {};

    const modoUp = String(CONFIG.modoFila || "").toUpperCase();
    const ehCompleta12h = modoUp === "COMPLETA" || modoUp === "12H" || modoUp === "3";
    const ehAmpla3h = modoUp === "2A" || modoUp === "3H" || modoUp === "AMPLA" || modoUp === "TURNO" || modoUp === "DEPTOS";

    let ultimaCompleta12hMs = Number(atual.ultimaCompleta12hMs || sessao.agendamentoAuto.ultimaCompleta12hMs || 0);
    let ultimaAmpla3hMs = Number(atual.ultimaAmpla3hMs || sessao.agendamentoAuto.ultimaAmpla3hMs || 0);
    let ultimoCiclo24hMs = Number(atual.ultimoCiclo24hMs || sessao.agendamentoAuto.ultimoCiclo24hMs || 0);

    if (ehCompleta12h) {
      ultimaCompleta12hMs = agoraMs;
      ultimaAmpla3hMs = agoraMs; // A varredura completa de 12h já engloba a ampla de 3h
    } else if (ehAmpla3h) {
      ultimaAmpla3hMs = agoraMs;
      if (!ultimaCompleta12hMs) ultimaCompleta12hMs = agoraMs;
    } else {
      ultimoCiclo24hMs = agoraMs;
      if (!ultimaAmpla3hMs) ultimaAmpla3hMs = agoraMs;
      if (!ultimaCompleta12hMs) ultimaCompleta12hMs = agoraMs;
    }

    sessao.agendamentoAuto = {
      ultimaCompleta12hMs,
      ultimaAmpla3hMs,
      ultimoCiclo24hMs
    };

    const payload = {
      ...atual,
      ultimaCompleta12hMs,
      ultimaCompleta12hISO: ultimaCompleta12hMs ? new Date(ultimaCompleta12hMs).toISOString() : null,
      proximaCompleta12hEmMs: ultimaCompleta12hMs + 12 * 3600 * 1000,
      proximaCompleta12hISO: new Date(ultimaCompleta12hMs + 12 * 3600 * 1000).toISOString(),
      ultimaAmpla3hMs,
      ultimaAmpla3hISO: ultimaAmpla3hMs ? new Date(ultimaAmpla3hMs).toISOString() : null,
      proximaAmpla3hEmMs: ultimaAmpla3hMs + 3 * 3600 * 1000,
      proximaAmpla3hISO: new Date(ultimaAmpla3hMs + 3 * 3600 * 1000).toISOString(),
      ultimoCiclo24hMs,
      ultimoCiclo24hISO: ultimoCiclo24hMs ? new Date(ultimoCiclo24hMs).toISOString() : null,
      modoAtual: modoUp,
      etapaAtual: etapa,
      maquinasPorSite: TOTAL_WORKERS,
      atualizadoEm: agoraISO
    };

    await fetch(authUrl(FIREBASE_AGENDAMENTO_ENDPOINT), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {}
}

async function salvarCursor24hRemoto(rIdx, offset = 0, rotaConcluidaBool = true, pagAtual = 1) {
  if (!FIREBASE_BASE || WORKER_ID !== 1) return;
  try {
    const total = ROTAS_ATIVAS.length || 1;
    const prox = rotaConcluidaBool ? ((rIdx + 1) >= total ? 0 : (rIdx + 1)) : Math.max(0, Math.min(total - 1, rIdx));
    const rotaAlvo = ROTAS_ATIVAS[prox] || ROTAS_ATIVAS[0] || {};
    const payload = {
      rotaIndice: prox,
      pathReal: chaveCategoriaRota(rotaAlvo),
      rotaNome: rotaAlvo.nomeBase || rotaAlvo.nome || "Início",
      rotaConcluida: rotaConcluidaBool ? (ROTAS_ATIVAS[rIdx]?.nome || "") : "",
      offset: rotaConcluidaBool ? 0 : Math.max(0, Number(offset || 0)),
      pag: rotaConcluidaBool ? 1 : Math.max(1, Number(pagAtual || 1)),
      totalRotas: total,
      atualizadoEm: new Date().toISOString()
    };
    await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/cursor_24h_${MERCADO_ALVO}.json`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {}
}

function devePausarParaProximaOperacao() {
  if (!EH_MODO_24H) return { pausar: false };
  const agoraMs = Date.now();
  const { ultimaCompleta12hMs, ultimaAmpla3hMs } = sessao.agendamentoAuto || {};

  // 1. Verifica se chegou o horário da Varredura Completa de 12 em 12 horas (10 máquinas em cada site)
  if (ultimaCompleta12hMs > 0 && (agoraMs - ultimaCompleta12hMs) >= (12 * 3600 - 90) * 1000) {
    return {
      pausar: true,
      motivo: "Horário de 12h atingido — iniciando Varredura Completa (10 máquinas em cada site)"
    };
  }

  // 2. Verifica se chegou o horário da Busca Ampla de 3 em 3 horas (10 máquinas em cada site)
  if (ultimaAmpla3hMs > 0 && (agoraMs - ultimaAmpla3hMs) >= (3 * 3600 - 90) * 1000) {
    return {
      pausar: true,
      motivo: "Horário de 3h atingido — iniciando Busca Ampla (10 máquinas em cada site)"
    };
  }

  // 3. Revezamento automático de segurança a cada 42 minutos para manter o modo 24h rodando sem parar
  if ((agoraMs - sessao.tempoInicioMs) >= 42 * 60 * 1000) {
    return {
      pausar: true,
      motivo: "Revezamento contínuo 24h (42 min) — auto-disparando próximo turno no mesmo ponto"
    };
  }

  return { pausar: false };
}

function recalcularFatiaDoWorker() {
  const baseRotas = Array.isArray(ROTAS_BASE_MODO) && ROTAS_BASE_MODO.length > 0
    ? ROTAS_BASE_MODO.map((r) => ({ ...r, nomeBase: r.nomeBase || r.nome }))
    : [];

  if (baseRotas.length === 0) {
    ROTAS_ATIVAS = [];
    sessao.rotaTotal = 0;
    sessao.meuIndiceInicio = 0;
    sessao.meuIndiceFim = 0;
    sessao.minhasRotasIndices = [];
    return;
  }

  // Modo de 1 Máquina (24h Contínuo buscando Mais Acessados + Promoções):
  // Ordena Promoções primeiro e depois as seções onde há mais itens salvos!
  if (TOTAL_WORKERS <= 1) {
    const promos = baseRotas.filter((r) => r.tipo === "promocoes" || r.tipo === "promocao");
    const demais = baseRotas
      .filter((r) => r.tipo !== "promocoes" && r.tipo !== "promocao")
      .sort((a, b) => obterPesoCategoria(b) - obterPesoCategoria(a));

    ROTAS_ATIVAS = [...promos, ...demais].map((r) => {
      const peso = obterPesoCategoria(r);
      return {
        ...r,
        nomeBase: r.nomeBase || r.nome,
        fatiaIndex: 1,
        fatiaTotal: 1,
        pagInicioFatia: 1,
        pagFimFatia: null,
        offsetInicioFatia: 0,
        offsetFimFatia: null,
        pesoEstimado: peso,
        pesoTotalCategoria: peso
      };
    });

    sessao.rotaTotal = ROTAS_ATIVAS.length;
    sessao.meuIndiceInicio = 0;
    sessao.meuIndiceFim = Math.max(0, ROTAS_ATIVAS.length - 1);

    if (sessao.pathRetomada24h) {
      const idxPorPath = ROTAS_ATIVAS.findIndex((r) => chaveCategoriaRota(r) === sessao.pathRetomada24h);
      if (idxPorPath >= 0) {
        CONFIG.startIndex = idxPorPath;
      }
    }
    sessao.rotaIndiceAtual = Math.max(0, Math.min(sessao.meuIndiceFim, CONFIG.startIndex));
    sessao.minhasRotasIndices = ROTAS_ATIVAS.map((_, idx) => idx);
    sessao.minhaCargaEstimadaItens = ROTAS_ATIVAS.reduce((acc, r) => acc + (r.pesoEstimado || 0), 0);
    sessao.resumoDistribuicaoPlanejada = [{
      workerId: 1,
      cargaItens: sessao.minhaCargaEstimadaItens,
      totalTarefas: ROTAS_ATIVAS.length,
      categorias: ROTAS_ATIVAS.slice(0, 8).map((r) => `${r.nomeBase || r.nome} (~${r.pesoEstimado} itens)`)
    }];
    return;
  }

  // =========================================================================
  // MODO MULTI-MÁQUINAS (10 MÁQUINAS EM CADA SITE - 3H AMPLA E 12H COMPLETA):
  // 1) Calcula o volume real de itens de cada seção salvo nas verificações.
  // 2) Divide automaticamente categorias grandes (ex: Mercearia, Promoções, Higiene, Bazar)
  //    em múltiplas fatias de páginas para colocar MAIS DE 1 MÁQUINA na mesma categoria!
  // 3) Distribui todas as fatias e categorias uniformemente (Greedy LPT) para que todas
  //    as 10 máquinas processem praticamente a mesma quantidade de itens!
  // =========================================================================
  const pesosBase = baseRotas.map((r) => obterPesoCategoria(r));
  const somaTotalItens = Math.max(100, pesosBase.reduce((acc, p) => acc + p, 0));
  const metaItensPorMaquina = Math.max(80, Math.ceil(somaTotalItens / TOTAL_WORKERS));

  const tarefasExpandidas = [];
  for (let i = 0; i < baseRotas.length; i++) {
    const r = baseRotas[i];
    const peso = pesosBase[i];
    const nomeOriginal = r.nomeBase || r.nome;

    // Se a seção tem mais itens que a média de 1 máquina (ou >75% da média na busca ampla),
    // divide a categoria entre 2, 3, 4+ máquinas simultâneas por faixas de páginas/offset!
    const limiarDivisao = baseRotas.length <= TOTAL_WORKERS * 2
      ? metaItensPorMaquina * 0.72
      : metaItensPorMaquina * 1.12;

    let numFatias = 1;
    if (peso >= limiarDivisao && peso >= CONFIG.size * 4) {
      numFatias = Math.min(
        TOTAL_WORKERS,
        Math.max(2, Math.round(peso / (metaItensPorMaquina * 0.82)))
      );
      const maxFatiasPorTamanho = Math.max(1, Math.floor(peso / (CONFIG.size * 3)));
      numFatias = Math.min(numFatias, maxFatiasPorTamanho);
    }

    if (numFatias <= 1) {
      tarefasExpandidas.push({
        ...r,
        nomeBase: nomeOriginal,
        nome: nomeOriginal,
        fatiaIndex: 1,
        fatiaTotal: 1,
        pagInicioFatia: 1,
        pagFimFatia: null,
        offsetInicioFatia: 0,
        offsetFimFatia: null,
        pesoEstimado: peso,
        pesoTotalCategoria: peso,
        ordemOriginal: i
      });
    } else {
      const totalPagsCat = Math.max(numFatias, Math.ceil(peso / CONFIG.size));
      const pagsPorFatia = Math.max(1, Math.ceil(totalPagsCat / numFatias));

      for (let f = 0; f < numFatias; f++) {
        const pagInicio = f * pagsPorFatia + 1;
        if (pagInicio > totalPagsCat && f > 0) break;
        const ehUltimaFatia = (f === numFatias - 1) || ((f + 1) * pagsPorFatia >= totalPagsCat);
        const pagFim = ehUltimaFatia ? null : Math.min(totalPagsCat, (f + 1) * pagsPorFatia);
        const offsetInicio = (pagInicio - 1) * CONFIG.size;
        const offsetFim = ehUltimaFatia ? null : (pagFim * CONFIG.size);
        const pesoFatia = ehUltimaFatia
          ? Math.max(CONFIG.size, peso - offsetInicio)
          : Math.max(CONFIG.size, (pagFim - pagInicio + 1) * CONFIG.size);

        tarefasExpandidas.push({
          ...r,
          nomeBase: nomeOriginal,
          nome: `${nomeOriginal} [Máq ${f + 1}/${numFatias} • Págs ${pagInicio}-${ehUltimaFatia ? "Fim" : pagFim}]`,
          fatiaIndex: f + 1,
          fatiaTotal: numFatias,
          pagInicioFatia: pagInicio,
          pagFimFatia: pagFim,
          offsetInicioFatia: offsetInicio,
          offsetFimFatia: offsetFim,
          pesoEstimado: pesoFatia,
          pesoTotalCategoria: peso,
          ordemOriginal: i
        });
        if (ehUltimaFatia) break;
      }
    }
  }

  ROTAS_ATIVAS = tarefasExpandidas;
  sessao.rotaTotal = ROTAS_ATIVAS.length;

  // Balanceamento Uniforme LPT (Longest Processing Time First) entre as 10 Máquinas
  const buckets = Array.from({ length: TOTAL_WORKERS }, (_, idx) => ({
    workerId: idx + 1,
    cargaItens: 0,
    indices: [],
    pathsAtribuidos: new Set()
  }));

  const indicesOrdenadosPorPeso = ROTAS_ATIVAS.map((_, idx) => idx).sort((a, b) => {
    const diffPeso = (ROTAS_ATIVAS[b].pesoEstimado || 0) - (ROTAS_ATIVAS[a].pesoEstimado || 0);
    if (diffPeso !== 0) return diffPeso;
    return a - b;
  });

  for (const idxTarefa of indicesOrdenadosPorPeso) {
    const tarefa = ROTAS_ATIVAS[idxTarefa];
    const chPath = chaveCategoriaRota(tarefa);

    // Escolhe a máquina com menor carga acumulada de itens, priorizando máquina que ainda não tenha outra fatia da mesma categoria
    let melhorBucket = null;
    for (const b of buckets) {
      if (b.pathsAtribuidos.has(chPath)) continue;
      if (!melhorBucket || b.cargaItens < melhorBucket.cargaItens) {
        melhorBucket = b;
      }
    }
    if (!melhorBucket) {
      for (const b of buckets) {
        if (!melhorBucket || b.cargaItens < melhorBucket.cargaItens) {
          melhorBucket = b;
        }
      }
    }

    melhorBucket.indices.push(idxTarefa);
    melhorBucket.cargaItens += Number(tarefa.pesoEstimado || 20);
    if (chPath) melhorBucket.pathsAtribuidos.add(chPath);
  }

  // Dentro de cada máquina, prioriza Promoções e Departamentos maiores primeiro
  for (const b of buckets) {
    b.indices.sort((a, bIdx) => {
      const ra = ROTAS_ATIVAS[a];
      const rb = ROTAS_ATIVAS[bIdx];
      const pA = (ra?.tipo === "promocoes" || ra?.tipo === "promocao") ? 0 : (ra?.tipo === "depto" ? 1 : 2);
      const pB = (rb?.tipo === "promocoes" || rb?.tipo === "promocao") ? 0 : (rb?.tipo === "depto" ? 1 : 2);
      if (pA !== pB) return pA - pB;
      return (rb?.pesoEstimado || 0) - (ra?.pesoEstimado || 0);
    });
  }

  const meuBucket = buckets[Math.max(0, Math.min(TOTAL_WORKERS - 1, WORKER_ID - 1))];
  sessao.minhasRotasIndices = meuBucket.indices;
  sessao.minhaCargaEstimadaItens = meuBucket.cargaItens;
  sessao.meuIndiceInicio = meuBucket.indices.length > 0 ? Math.min(...meuBucket.indices) : 0;
  sessao.meuIndiceFim = meuBucket.indices.length > 0 ? Math.max(...meuBucket.indices) : 0;
  sessao.rotaIndiceAtual = meuBucket.indices[0] ?? 0;
  sessao.resumoDistribuicaoPlanejada = buckets.map((b) => ({
    workerId: b.workerId,
    cargaItens: b.cargaItens,
    totalTarefas: b.indices.length,
    categorias: b.indices.slice(0, 6).map((idx) => ROTAS_ATIVAS[idx]?.nome || `#${idx + 1}`)
  }));
}

// =========================================================================
// CAMADA 1: LEITURA E BACKUP DO FIREBASE ANTES DE QUALQUER AÇÃO
// =========================================================================
async function carregarProtegerFirebaseInicial() {
  if (SOU_MAESTRO) {
    try {
      await fetch(authUrl(`${FIREBASE_ENXAME_BASE}.json`), { method: "DELETE" });
    } catch {}
  }

  registrarLog("OK", "Proteção Firebase", `Lendo banco atual de ${MERCADO_NOME} em: ${FIREBASE_ENDPOINT}`);

  let resp = null;
  while (!resp || !resp.ok) {
    try {
      resp = await fetch(authUrl(FIREBASE_ENDPOINT));
      if (resp.ok) break;
      registrarLog("ERRO", "Firebase Inicial", `HTTP ${resp.status} ao ler banco inicial. Aguardando 30s...`);
    } catch (err) {
      registrarLog("ERRO", "Firebase Inicial", `Erro de conexão ao ler banco inicial: ${err.message}. Aguardando 30s...`);
    }
    await dormir(30000);
  }

  // 1. Popula o catálogo atual na memória primeiro (serve também para estimativa inicial de itens por seção)
  const dados = await resp.json();
  if (dados && Array.isArray(dados.produtos)) {
    if (SOU_MAESTRO) {
      const arqBackup = EH_ANGELONI
        ? "backup_angeloni_28_antes.json"
        : (EH_FORT ? "backup_fort_1644_antes.json" : "backup_koch_1408_antes.json");
      try {
        fs.writeFileSync(arqBackup, JSON.stringify(dados), "utf-8");
      } catch {}
    }

    for (const p of dados.produtos) {
      if (p && p.id) {
        if (p.historicoPrecos && typeof p.historicoPrecos === "object") {
          p.historicoPrecos = atualizarHistoricoSemDuplicarConsecutivos(p.historicoPrecos, "", 0);
        }
        mapaProdutos.set(p.id, p);
      }
    }
    sessao.totalInicialFirebase = mapaProdutos.size;
    sessao.totalAtualNoBanco = mapaProdutos.size;
    registrarLog("OK", "Proteção Firebase", `${sessao.totalInicialFirebase} produtos carregados e protegidos na memória.`);
  }

  // 2. Lê histórico de pesos de itens por categoria salvo nas verificações anteriores + estado do agendador 24h/3h/12h
  try {
    const [rPesos, rAgend] = await Promise.all([
      fetch(authUrl(FIREBASE_PESOS_ENDPOINT)).catch(() => null),
      fetch(authUrl(FIREBASE_AGENDAMENTO_ENDPOINT)).catch(() => null)
    ]);
    if (rPesos && rPesos.ok) {
      const dPesos = await rPesos.json().catch(() => null);
      if (Array.isArray(dPesos?.rankingSecoes)) {
        for (const val of dPesos.rankingSecoes) {
          if (val && val.pathReal && Number(val.totalItens) > 0) {
            mapaPesosCategorias.set(String(val.pathReal).toLowerCase(), val);
          }
        }
      }
      const mapaSalvo = dPesos?.mapaPorPath || {};
      for (const [k, val] of Object.entries(mapaSalvo)) {
        if (val && Number(val.totalItens) > 0) {
          const chReal = String(val.pathReal || k.replace(/__/g, "/")).toLowerCase();
          mapaPesosCategorias.set(chReal.startsWith("/") ? chReal : `/${chReal}`, val);
        }
      }
    }
    if (rAgend && rAgend.ok) {
      const dAg = await rAgend.json().catch(() => null);
      if (dAg && typeof dAg === "object") {
        sessao.agendamentoAuto = {
          ultimaCompleta12hMs: Number(dAg.ultimaCompleta12hMs || 0),
          ultimaAmpla3hMs: Number(dAg.ultimaAmpla3hMs || 0),
          ultimoCiclo24hMs: Number(dAg.ultimoCiclo24hMs || 0)
        };
      }
    }
  } catch {}

  // Preenche qualquer seção ainda não medida com a contagem exata do catálogo carregado
  popularPesosIniciaisPeloCatalogo();

  // Registra início da operação no agendador automático (3h / 12h / 24h)
  if (SOU_MAESTRO) {
    await registrarAgendamentoAutoNoFirebase("em_execucao");
  }

  try {
    const rCmd = await fetch(authUrl(FIREBASE_COMANDOS_ENDPOINT));
    if (rCmd.ok) {
      const cAntigo = await rCmd.json();
      if (cAntigo && (cAntigo.id || cAntigo.timestamp)) {
        sessao.ultimoComandoIdProcessado = Number(cAntigo.id || cAntigo.timestamp || 0);
      }
      if (cAntigo?.config) {
        if (Number(cAntigo.config.salvarAoAdicionar) >= 10) CONFIG.salvarAoAdicionar = Number(cAntigo.config.salvarAoAdicionar);
        if (Number(cAntigo.config.salvarAoAtualizar) >= 25) CONFIG.salvarAoAtualizar = Number(cAntigo.config.salvarAoAtualizar);
        if (Number(cAntigo.config.size) >= 12) CONFIG.size = Math.min(MAX_ALLOWED_SIZE, Number(cAntigo.config.size));
        if (cAntigo.config.modoFila && !process.env.MODO_FILA && !process.env.MODO_CAMADA) CONFIG.modoFila = String(cAntigo.config.modoFila).toUpperCase();
        if (typeof cAntigo.config.usarProxy === "boolean") CONFIG.usarProxy = cAntigo.config.usarProxy;
        if (Array.isArray(cAntigo.config.listaProxies)) CONFIG.listaProxies = cAntigo.config.listaProxies.filter(Boolean);
      }
    }
  } catch {}

  let filaCustomSalva = null;
  try {
    const rFila = await fetch(authUrl(FIREBASE_FILA_ENDPOINT));
    if (rFila.ok) {
      const dFila = await rFila.json();
      const arr = Array.isArray(dFila) ? dFila : (Array.isArray(dFila?.rotas) ? dFila.rotas : null);
      if (arr && arr.length > 0) {
        filaCustomSalva = arr;
      }
    }
  } catch {}

  ROTAS_BASE_MODO = obterRotasFiltradasPorModo(CONFIG.modoFila, filaCustomSalva);

  // Sincroniza a árvore oficial do GraphQL ANTES de dividir as categorias entre as máquinas!
  const sincGqlOk = await sincronizarArvoreCategoriasGraphQL(ROTAS_BASE_MODO);
  if (sincGqlOk) {
    popularPesosIniciaisPeloCatalogo();
    registrarLog("OK", "GraphQL", `Árvore oficial da loja ${LOJA_ID} sincronizada (${ROTAS_BASE_MODO.length} seções base validadas).`);
  }

  // No modo 24H Contínuo (ou se não foi passado rota inicial manual > 1), retoma exatamente da categoria e página onde parou
  if (EH_MODO_24H && (!process.env.START_INDEX || Number(process.env.START_INDEX) <= 1) && WORKER_ID === 1) {
    try {
      const resCur = await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/cursor_24h_${MERCADO_ALVO}.json`));
      if (resCur.ok) {
        const curData = await resCur.json();
        if (curData) {
          if (curData.pathReal) sessao.pathRetomada24h = String(curData.pathReal).toLowerCase();
          if (Number.isInteger(curData.rotaIndice)) {
            CONFIG.startIndex = Math.max(0, curData.rotaIndice);
          }
          if (Number(curData.offset) > 0) {
            sessao.offsetRetomada24h = Number(curData.offset);
            sessao.pagRetomada24h = Math.max(1, Number(curData.pag) || (Math.floor(sessao.offsetRetomada24h / CONFIG.size) + 1));
          }
        }
      }
    } catch {}
  }

  recalcularFatiaDoWorker();

  if (SOU_MAESTRO) {
    await salvarPesosCategoriasNoFirebase(sessao.progressoRotas);
  }

  if (EH_MODO_24H && WORKER_ID === 1) {
    registrarLog(
      "OK",
      "Cursor 24h",
      `Modo 24h Contínuo (Mais Acessados & Promoções): iniciando em #${sessao.rotaIndiceAtual + 1}/${ROTAS_ATIVAS.length} (${ROTAS_ATIVAS[sessao.rotaIndiceAtual]?.nome || "Início"} • Pág ${sessao.pagRetomada24h}).`
    );
  }

  const resumoTopSecoes = Array.from(mapaPesosCategorias.values())
    .sort((a, b) => Number(b.totalItens || 0) - Number(a.totalItens || 0))
    .slice(0, 4)
    .map((s) => `${s.depto || s.nome}: ${s.totalItens} it.`)
    .join(" | ");

  registrarLog(
    "OK",
    "Divisão Adaptativa",
    `${MERCADO_NOME} • Modo ${CONFIG.modoFila}: ${ROTAS_ATIVAS.length} tarefas/fatias totais. Máquina #${WORKER_ID}/${TOTAL_WORKERS} assumiu ${sessao.minhasRotasIndices.length} fatia(s) (~${sessao.minhaCargaEstimadaItens} itens estimados). Maiores seções: ${resumoTopSecoes}`
  );
}

// =========================================================================
// CAMADA 2: MERGE INCREMENTAL COM PREÇO CLUBE E VUON DISCRETO
// =========================================================================
function processarHits(hits, rotaContexto = null) {
  if (!Array.isArray(hits) || hits.length === 0) {
    return { novosLote: 0, precosLote: 0, estoquesLote: 0 };
  }
  let novosLote = 0;
  let precosLote = 0;
  let estoquesLote = 0;
  const catRotaNome = rotaContexto?.nome || "Geral";
  const horaStr = horaAtualBR();

  for (const item of hits) {
    if (!item || !item.id) continue;
    sessao.totalLidosNaSessao++;

    const existente = mapaProdutos.get(item.id);

    // Preços base
    const precoNormal = Number(item.pricing?.price || item.pricing?.normalPrice || 0);
    const precoPromo = Number(item.pricing?.promotionalPrice || item.activePrice || precoNormal);

    // Preço Clube (Clube Mais no Fort ou Clube K no Koch)
    let precoClube = 0;
    if (Array.isArray(item.personaPromotions) && item.personaPromotions.length > 0) {
      const pC = Number(item.personaPromotions[0]?.price || item.personaPromotions[0]?.promotionalPrice || 0);
      if (pC > 0) precoClube = pC;
    }

    // Preço Vuon Card (apenas Fort)
    let precoVuon = null;
    if (Array.isArray(item.paymentPromotions) && item.paymentPromotions.length > 0) {
      const pV = Number(item.paymentPromotions[0]?.price || item.paymentPromotions[0]?.promotionalPrice || 0);
      if (pV > 0) precoVuon = pV;
    } else if (Array.isArray(item.paymentConditionalPrices) && item.paymentConditionalPrices.length > 0) {
      const pV = Number(item.paymentConditionalPrices[0]?.price || 0);
      if (pV > 0) precoVuon = pV;
    }

    // REGRA DE OURO SOLICITADA: Preço de comparação leva em consideração Clube e Promocional, NUNCA Vuon Card!
    const precosCandidatos = [precoClube, precoPromo, precoNormal].filter((x) => x > 0);
    const precoFinal = precosCandidatos.length > 0 ? Math.min(...precosCandidatos) : (precoPromo || precoNormal);

    const precoSeguro = precoFinal > 0 ? precoFinal : Number(existente?.preco || 0);
    const precoOrigSeguro = precoNormal > precoSeguro ? precoNormal : Number(existente?.precoOriginal || precoSeguro);

    const setCats = new Set();
    if (existente && Array.isArray(existente.categorias)) {
      existente.categorias.forEach((c) => { if (typeof c === "string" && c.trim()) setCats.add(c.trim()); });
    }
    if (Array.isArray(item.categories)) {
      item.categories.forEach((c) => {
        if (typeof c === "string" && c.trim()) {
          const limpo = c.replace(/^store\d+:/, "").trim();
          if (limpo) setCats.add(limpo);
        } else if (c && typeof c === "object" && c.name) {
          setCats.add(String(c.name).trim());
        }
      });
    }
    if (item.level1Category?.name) setCats.add(String(item.level1Category.name).trim());
    if (item.level2Category?.name) setCats.add(String(item.level2Category.name).trim());
    if (item.level2Category?.parent?.name) setCats.add(String(item.level2Category.parent.name).trim());
    if (rotaContexto) {
      if (rotaContexto.depto && rotaContexto.depto !== "Página Inicial" && rotaContexto.depto !== "Categorias") {
        setCats.add(rotaContexto.depto);
      }
      if (rotaContexto.nome) setCats.add(rotaContexto.nome);
    }

    const imgStr = typeof item.image === "string"
      ? item.image
      : (item.image?.thumborized || item.image?.url || existente?.imagem || "");

    const marcaStr = String(item.brandName || item.brand?.name || existente?.marca || "GENÉRICO").trim();
    const nomeLimpo = String(item.name || existente?.nome || "Produto sem nome").trim();
    const estoqueNovo = item.quantity?.inStock ?? existente?.estoque ?? 0;

    const historico = atualizarHistoricoSemDuplicarConsecutivos(existente?.historicoPrecos, dataHojeISO, precoSeguro);
    const emPromo = Boolean(item.pricing?.promotion || (precoOrigSeguro > precoSeguro && precoSeguro > 0) || (precoClube > 0 && precoClube < precoNormal));
    const descPct = item.pricing?.discount || (precoOrigSeguro > precoSeguro && precoOrigSeguro > 0 ? Math.round(((precoOrigSeguro - precoSeguro) / precoOrigSeguro) * 100) : 0);

    let foiAlteradoOuNovo = false;

    if (!existente) {
      foiAlteradoOuNovo = true;
      novosLote++;
      sessao.novosNaSessao++;
      sessao.novosDesdeUltimoSave++;
      sessao.ultimosNovos.unshift({
        id: item.id,
        nome: nomeLimpo,
        marca: marcaStr,
        preco: precoSeguro,
        precoOriginal: precoOrigSeguro,
        precoClube: precoClube > 0 ? precoClube : null,
        precoVuon: precoVuon > 0 ? precoVuon : null,
        desconto: descPct,
        estoque: estoqueNovo,
        imagem: imgStr,
        categoria: catRotaNome,
        mercado: MERCADO_ALVO,
        hora: horaStr
      });
      if (sessao.ultimosNovos.length > 50) sessao.ultimosNovos.pop();
    } else {
      const precoAntigo = Number(existente.preco || 0);
      const precoOrigAntigo = Number(existente.precoOriginal || precoAntigo);
      const estoqueAntigo = Number(existente.estoque ?? 0);
      const mudouPreco = precoSeguro > 0 && Math.abs(precoAntigo - precoSeguro) >= 0.01;
      const mudouPrecoOrig = Math.abs(precoOrigAntigo - precoOrigSeguro) >= 0.01;
      const mudouEstoque = estoqueAntigo !== Number(estoqueNovo);

      if (mudouPreco) {
        foiAlteradoOuNovo = true;
        precosLote++;
        sessao.precosAlteradosNaSessao++;
        sessao.atualizadosNaSessao++;
        sessao.atualizadosDesdeUltimoSave++;
        const diferenca = Number((precoSeguro - precoAntigo).toFixed(2));
        const pctMudanca = precoAntigo > 0 ? Math.round(((precoSeguro - precoAntigo) / precoAntigo) * 100) : 0;
        sessao.ultimosPrecosAlterados.unshift({
          id: item.id,
          nome: nomeLimpo,
          marca: marcaStr,
          precoAntigo,
          precoNovo: precoSeguro,
          precoClube: precoClube > 0 ? precoClube : null,
          precoVuon: precoVuon > 0 ? precoVuon : null,
          diferenca,
          pctMudanca,
          estoque: estoqueNovo,
          imagem: imgStr,
          categoria: catRotaNome,
          mercado: MERCADO_ALVO,
          hora: horaStr
        });
        if (sessao.ultimosPrecosAlterados.length > 60) sessao.ultimosPrecosAlterados.pop();
      } else if (mudouEstoque || mudouPrecoOrig) {
        foiAlteradoOuNovo = true;
        estoquesLote++;
        sessao.estoquesAlteradosNaSessao++;
        sessao.atualizadosNaSessao++;
        sessao.atualizadosDesdeUltimoSave++;
        sessao.ultimosEstoquesAlterados.unshift({
          id: item.id,
          nome: nomeLimpo,
          marca: marcaStr,
          estoqueAntigo,
          estoqueNovo,
          preco: precoSeguro,
          categoria: catRotaNome,
          mercado: MERCADO_ALVO,
          hora: horaStr
        });
        if (sessao.ultimosEstoquesAlterados.length > 40) sessao.ultimosEstoquesAlterados.pop();
      }
    }

    const objProduto = {
      id: item.id,
      ean: item.ean || existente?.ean || "",
      nome: nomeLimpo,
      marca: marcaStr,
      preco: precoSeguro,
      precoOriginal: precoOrigSeguro,
      precoClube: precoClube > 0 ? precoClube : null,
      precoVuon: precoVuon > 0 ? precoVuon : (existente?.precoVuon || null),
      emPromocao: emPromo,
      desconto: descPct,
      estoque: estoqueNovo,
      unidade: item.saleUnit || existente?.unidade || "UN",
      imagem: imgStr,
      categorias: Array.from(setCats),
      slug: item.slug || existente?.slug || "",
      mercado: MERCADO_ALVO,
      lojaId: LOJA_ID,
      historicoPrecos: historico,
      atualizadoEm: new Date().toISOString()
    };

    mapaProdutos.set(item.id, objProduto);
    if (foiAlteradoOuNovo) {
      mapaDeltaWorker.set(item.id, objProduto);
    }

    const tagVuon = objProduto.precoVuon ? ` (Vuon: R$ ${objProduto.precoVuon.toFixed(2)})` : "";
    sessao.ultimosLidos.unshift(`${nomeLimpo} • R$ ${precoSeguro.toFixed(2).replace(".", ",")}${tagVuon}`);
    if (sessao.ultimosLidos.length > 8) sessao.ultimosLidos.pop();
  }

  sessao.totalAtualNoBanco = mapaProdutos.size;
  return { novosLote, precosLote, estoquesLote };
}

// =========================================================================
// GRAVAÇÃO BLINDADA NO FIREBASE
// =========================================================================
async function gravarComSegurancaNoFirebase(motivo = "") {
  if (!SOU_MAESTRO) {
    await publicarEstadoWorkerNoEnxame();
    sessao.novosDesdeUltimoSave = 0;
    sessao.atualizadosDesdeUltimoSave = 0;
    sessao.ultimoSaveMs = Date.now();
    return true;
  }

  try {
    const enxame = await absorverEnxameNoMaestro();
    const listaFinal = Array.from(mapaProdutos.values());
    if (listaFinal.length === 0) return false;

    if (sessao.totalInicialFirebase > 0 && listaFinal.length < sessao.totalInicialFirebase) {
      registrarLog("ERRO", "Proteção Firebase", `TRAVA ACIONADA! Lista (${listaFinal.length}) menor que o banco inicial (${sessao.totalInicialFirebase}).`);
      return false;
    }

    if (CONFIG.dryRun) {
      sessao.novosDesdeUltimoSave = 0;
      sessao.atualizadosDesdeUltimoSave = 0;
      sessao.ultimoSaveMs = Date.now();
      return true;
    }

    const houveAlteracoes = enxame.novosGlobal > 0 || enxame.precosGlobal > 0 || enxame.estoquesGlobal > 0 || sessao.novosDesdeUltimoSave > 0 || sessao.atualizadosDesdeUltimoSave > 0;
    const forcarCompleto = motivo.includes("100% Concluída") || motivo.includes("Manual") || motivo.includes("Inicial");

    // ECONOMIA DE BANDA FIREBASE SPARK (Camada Radar): Se nada mudou, atualiza apenas heartbeat (200 bytes em vez de 12MB!)
    if (!houveAlteracoes && !forcarCompleto) {
      registrarLog("OK", "Economia Firebase", `Nenhuma alteração de preço/estoque detectada. Heartbeat leve enviado (Economia de 99.9% de banda).`);
      await salvarPesosCategoriasNoFirebase(enxame.progressoCombinado);
      await fetch(authUrl(FIREBASE_ENDPOINT), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atualizadoEm: new Date().toISOString(),
          "resumoUltimaSessao/motivoUltimoSave": `${motivo} (Verificado - Sem alterações)`,
          "resumoUltimaSessao/ultimoHeartbeat": new Date().toISOString()
        })
      }).catch(() => {});
      sessao.ultimoSaveMs = Date.now();
      return true;
    }

    await salvarPesosCategoriasNoFirebase(enxame.progressoCombinado);

    const resp = await fetch(authUrl(FIREBASE_ENDPOINT), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        atualizadoEm: new Date().toISOString(),
        totalItens: listaFinal.length,
        mercado: MERCADO_ALVO,
        mercadoNome: MERCADO_NOME,
        lojaId: LOJA_ID,
        resumoUltimaSessao: {
          novosAdicionados: enxame.novosGlobal,
          precosAtualizados: enxame.precosGlobal,
          estoquesAtualizados: enxame.estoquesGlobal,
          maquinasEnxame: TOTAL_WORKERS,
          modoFila: CONFIG.modoFila,
          motivoUltimoSave: motivo
        },
        produtos: listaFinal
      })
    });

    if (!resp.ok) {
      registrarLog("ERRO", "Firebase Save", `HTTP ${resp.status} ao salvar (${motivo}). Continuando sem parar!`);
      return false;
    }

    // Grava também nó compacto de últimas alterações (alimentação rápida do front-end sem ler 12MB)
    if (houveAlteracoes) {
      const alteracoesRecentes = [
        ...(enxame.precosListaCombinada || sessao.ultimosPrecosAlterados).slice(0, 45),
        ...(enxame.novosListaCombinada || sessao.ultimosNovos).slice(0, 35)
      ];
      await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/ultimas_alteracoes_${MERCADO_ALVO}.json`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atualizadoEm: new Date().toISOString(),
          mercado: MERCADO_ALVO,
          alteracoes: alteracoesRecentes
        })
      }).catch(() => {});
    }

    sessao.totalInicialFirebase = Math.max(sessao.totalInicialFirebase, listaFinal.length);
    sessao.savesRealizados++;
    sessao.ultimoSaveEm = horaAtualBR();
    sessao.ultimoSaveMotivo = motivo;
    sessao.ultimoSaveMs = Date.now();
    sessao.novosDesdeUltimoSave = 0;
    sessao.atualizadosDesdeUltimoSave = 0;
    mapaDeltaWorker.clear();

    registrarLog("OK", "Firebase Salvo", `${listaFinal.length} produtos salvos com segurança (${motivo}).`);
    return true;
  } catch (err) {
    registrarLog("ERRO", "Firebase Save", `Falha de rede ao salvar: ${err.message}`);
    return false;
  }
}

async function verificarAutoSaveInteligente(contextoCurto = "", fimDeRota = false) {
  if (!SOU_MAESTRO) {
    if (fimDeRota || sessao.novosDesdeUltimoSave >= 5 || sessao.atualizadosDesdeUltimoSave >= 25) {
      await publicarEstadoWorkerNoEnxame();
      sessao.novosDesdeUltimoSave = 0;
      sessao.atualizadosDesdeUltimoSave = 0;
    }
    return;
  }

  if (TOTAL_WORKERS > 1) {
    await absorverEnxameNoMaestro();
  }

  const tempoDesdeUltimoSave = Date.now() - sessao.ultimoSaveMs;
  const atingiuMetaNovos = sessao.novosDesdeUltimoSave >= CONFIG.salvarAoAdicionar;
  const atingiuMetaAtualizados = sessao.atualizadosDesdeUltimoSave >= CONFIG.salvarAoAtualizar;
  const temAlteracaoPendente = sessao.novosDesdeUltimoSave > 0 || sessao.atualizadosDesdeUltimoSave > 0;
  const atingiuTempoPeriodico = temAlteracaoPendente && tempoDesdeUltimoSave >= CONFIG.intervaloSavePeriodicoMs;

  if (!atingiuMetaNovos && !atingiuMetaAtualizados && !atingiuTempoPeriodico) return;
  if (!fimDeRota && !atingiuTempoPeriodico && tempoDesdeUltimoSave < CONFIG.cooldownSaveMs) return;

  let motivoDetalhe = "";
  if (atingiuMetaNovos) {
    motivoDetalhe = `+${sessao.novosDesdeUltimoSave} novos (Meta ${CONFIG.salvarAoAdicionar} • ${contextoCurto})`;
  } else if (atingiuMetaAtualizados) {
    motivoDetalhe = `${sessao.atualizadosDesdeUltimoSave} atualizados (Meta ${CONFIG.salvarAoAtualizar} • ${contextoCurto})`;
  } else {
    motivoDetalhe = `Auto-Save 30min (+${sessao.novosDesdeUltimoSave} novos / ${sessao.atualizadosDesdeUltimoSave} atualizados)`;
  }

  await gravarComSegurancaNoFirebase(motivoDetalhe);
}

function normalizarProdutoAngeloniParaHit(prod) {
  if (!prod || typeof prod !== "object") return null;
  const id = String(prod.productId || prod.itemId || prod.productReference || "").trim();
  if (!id) return null;

  const itemsArr = Array.isArray(prod.items) ? prod.items : [];
  const sku = itemsArr.find((it) => {
    const of = it?.sellers?.[0]?.commertialOffer;
    return Number(of?.AvailableQuantity || 0) > 0 && Number(of?.Price || 0) > 0;
  }) || itemsArr[0] || {};

  const sellersArr = Array.isArray(sku.sellers) ? sku.sellers : [];
  const seller = sellersArr.find((s) => s?.sellerId === "superangeloni28" || s?.sellerDefault) || sellersArr[0] || {};
  const offer = seller.commertialOffer || prod.offer || {};

  // Sempre utiliza commertialOffer.Price / ListPrice (preço regionalizado de Porto Belo e preço/kg correto em pesáveis)
  const precoAtivo = Number(offer.Price || 0);
  const precoLista = Number(offer.ListPrice || precoAtivo || 0);
  const estoque = Number(offer.AvailableQuantity ?? (precoAtivo > 0 ? 100 : 0));

  if (precoAtivo <= 0 || estoque <= 0) return null;

  const precoOriginal = precoLista > precoAtivo ? precoLista : precoAtivo;
  const unMedida = String(sku.measurementUnit || prod.measurementUnit || "UN").toUpperCase();
  const saleUnit = unMedida === "KG" ? "KG" : "UN";
  const imgUrl = sku.images?.[0]?.imageUrl || prod.images?.[0]?.imageUrl || prod.image || "";

  const setCats = new Set();
  if (Array.isArray(prod.categories)) {
    for (const cPath of prod.categories) {
      const partes = String(cPath || "").split("/").map((s) => s.trim()).filter(Boolean);
      if (partes.length > 0) {
        setCats.add(partes[0]);
        if (partes.length > 1) {
          setCats.add(`${partes[0]} > ${partes[1]}`);
          setCats.add(partes[partes.length - 1]);
        }
      }
    }
  }

  return {
    id,
    ean: String(sku.ean || prod.ean || "").trim(),
    name: String(prod.productName || sku.name || prod.name || "").trim(),
    brandName: String(prod.brand || prod.brandName || "GENÉRICO").trim(),
    pricing: {
      price: precoOriginal,
      normalPrice: precoOriginal,
      promotionalPrice: precoAtivo,
      promotion: precoOriginal > precoAtivo + 0.009
    },
    activePrice: precoAtivo,
    quantity: { inStock: estoque },
    saleUnit,
    image: imgUrl,
    categories: Array.from(setCats),
    slug: String(prod.link || prod.linkText || "").replace(/^https?:\/\/[^/]+/, "")
  };
}

function normalizarRespostaAngeloni(dados) {
  if (!dados || typeof dados !== "object") return null;
  if (Array.isArray(dados.hits) && dados._angeloniNorm) return dados;

  const rawArr = Array.isArray(dados.products)
    ? dados.products
    : (Array.isArray(dados?.data?.productSearch?.products)
      ? dados.data.productSearch.products
      : (Array.isArray(dados) ? dados : []));

  const hits = rawArr.map(normalizarProdutoAngeloniParaHit).filter(Boolean);
  const totalBruto = Number(
    dados.recordsFiltered ??
    dados?.data?.productSearch?.recordsFiltered ??
    dados.total ??
    hits.length
  );

  return {
    _angeloniNorm: true,
    total: totalBruto,
    hits,
    products: hits,
    fimEstoqueCategoria: rawArr.length > 0 && hits.length === 0
  };
}

function montarUrlOficial({
  storePath = DEFAULT_STORE_PATH,
  promo = false,
  size = CONFIG.size,
  from = 0,
  pag = 1,
  rota = null,
  usarCatalogFallback = false,
  categoryId = "",
  categoryName = ""
}) {
  const sizeSeguro = Math.max(12, Math.min(20, Number(size) || 20));

  if (EH_ANGELONI) {
    const pathRota = String(rota?.pathReal || "").replace(/^\/+|\/+$/g, "").trim();
    const pagCalc = Math.max(1, Number(pag) || (Math.floor(Math.max(0, Number(from) || 0) / sizeSeguro) + 1));

    // Fallback: API VTEX Catalog System (/api/catalog_system/pub/products/search/...)
    if (usarCatalogFallback) {
      const fromSeg = Math.max(0, Number(from) || 0);
      const toSeg = fromSeg + sizeSeguro - 1;
      if (promo) {
        const clusterId = (categoryId && /^\d+$/.test(String(categoryId))) ? String(categoryId) : "144";
        return `${SITE_URL}/api/catalog_system/pub/products/search?fq=productClusterIds:${clusterId}&O=OrderByTopSaleDESC&_from=${fromSeg}&_to=${toSeg}`;
      }
      const slugLimpo = pathRota || "mercearia";
      return `${SITE_URL}/api/catalog_system/pub/products/search/${slugLimpo}?O=OrderByTopSaleDESC&_from=${fromSeg}&_to=${toSeg}`;
    }

    // Primário: API VTEX Intelligent Search Regionalizada (Angeloni Porto Belo Loja 28 • CEP 88210-000)
    const baseIS = `${SITE_URL}/api/io/_v/api/intelligent-search/product_search/trade-policy/1`;
    const qsRegional = `sort=orders:desc&count=${sizeSeguro}&page=${pagCalc}&deliveryZonesHash=${ANGELONI_DELIVERY_HASH}&pickupPointHash=${ANGELONI_PICKUP_HASH}`;
    if (promo) {
      const clusterId = (categoryId && /^\d+$/.test(String(categoryId))) ? String(categoryId) : (rota?.id || "144");
      return `${baseIS}/productClusterIds/${encodeURIComponent(clusterId)}?${qsRegional}`;
    }
    const partes = (pathRota || "mercearia").split("/").filter(Boolean);
    const rotaCategoriasIS = partes.map((seg, idx) => `category-${idx + 1}/${encodeURIComponent(seg)}`).join("/");
    return `${baseIS}/${rotaCategoriasIS}?${qsRegional}`;
  }

  const base = `https://sense.osuper.com.br${storePath}`;
  const q = [];
  if (promo) q.push("promotion=true");
  q.push("brands=");
  q.push(`categories=${categoryName ? encodeURIComponent(categoryName) : ""}`);
  q.push("tags=");
  if (promo) {
    q.push("onlyPersonas=false");
    q.push("cashback=false");
    if (!EH_FORT) q.push("hidePersonas=690");
  }
  q.push(`size=${sizeSeguro}`);
  q.push(`from=${from}`);
  q.push("search=");
  q.push("sortField=sales_count");
  q.push("sortOrder=desc");
  if (categoryId && categoryId !== "PROMO_FORT" && categoryId !== "PROMO_KOCH") {
    q.push(`categoryId=${encodeURIComponent(categoryId)}`);
  }
  const urlFinal = `${base}?${q.join("&")}`;

  if (CONFIG.usarProxy && Array.isArray(CONFIG.listaProxies) && CONFIG.listaProxies.length > 0) {
    const proxyBase = CONFIG.listaProxies[sessao.indiceProxyAtual % CONFIG.listaProxies.length];
    sessao.indiceProxyAtual++;
    if (proxyBase && proxyBase.startsWith("http")) {
      return proxyBase.includes("?url=") || proxyBase.includes("&url=")
        ? `${proxyBase}${encodeURIComponent(urlFinal)}`
        : `${proxyBase.replace(/\/$/, "")}/?url=${encodeURIComponent(urlFinal)}`;
    }
  }
  return urlFinal;
}

// =========================================================================
// EXECUÇÃO PRINCIPAL DO ROBÔ INVISÍVEL (ARQUITETURA MULTI-MOTOR + ROLAGEM)
// =========================================================================
async function executarRoboCloud() {
  await detectarIpPublico();
  registrarLog("OK", "Rede", `IP Público detectado para Máquina #${WORKER_ID}: ${WORKER_PUBLIC_IP}`);

  if (WORKER_ID > 1) {
    await dormir((WORKER_ID - 1) * 1200);
  }

  await carregarProtegerFirebaseInicial();
  await enviarTelemetriaAoVivo(true);

  if (!Array.isArray(sessao.minhasRotasIndices) || sessao.minhasRotasIndices.length === 0 || ROTAS_ATIVAS.length === 0) {
    sessao.status = "CONCLUIDO";
    sessao.mensagem = `Máquina #${WORKER_ID} (${WORKER_PUBLIC_IP}) sem rotas pendentes nesta divisão.`;
    await enviarTelemetriaAoVivo(true);
    return;
  }

  const versaoChrome = 130 + (WORKER_ID % 2);
  const userAgentNativo = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${versaoChrome}.0.0.0 Safari/537.36`;

  let browser = null;
  let context = null;
  let page = null;
  let browserPronto = false;
  let tokenCapturado = EH_ANGELONI ? ANGELONI_SEGMENT_TOKEN : "";
  let storePath = DEFAULT_STORE_PATH;
  let motorPreferido = EH_ANGELONI ? "curl_http2" : "playwright_eval";
  let filaRespostasInterceptadas = [];

  async function garantirNavegadorFallback() {
    if (page && context && browser) {
      browserPronto = true;
      return;
    }
    registrarLog("OK", "Navegador", `Iniciando navegador Chromium furtivo na Máquina #${WORKER_ID}/${TOTAL_WORKERS} (IP: ${WORKER_PUBLIC_IP})...`);
    const { chromium } = await import("playwright");
    browser = await chromium.launch({
      headless: true,
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });
    context = await browser.newContext({
      locale: "pt-BR",
      timezoneId: "America/Sao_Paulo",
      userAgent: userAgentNativo,
      viewport: { width: 1366, height: 860 },
      extraHTTPHeaders: {
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
      }
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      window.chrome = window.chrome || { runtime: {} };
    });
    const cookiesIniciais = [
      {
        name: COOKIE_LOJA_NOME,
        value: COOKIE_LOJA_VALOR,
        domain: COOKIE_LOJA_DOMINIO,
        path: "/"
      }
    ];
    if (EH_ANGELONI) {
      cookiesIniciais.push({
        name: "vtex_segment",
        value: ANGELONI_SEGMENT_TOKEN,
        url: SITE_URL
      });
    }
    await context.addCookies(cookiesIniciais);
    page = await context.newPage();
    browserPronto = true;

    page.on("request", (req) => {
      if (EH_ANGELONI) return;
      const url = req.url();
      if (url.includes("sense.osuper.com.br") && url.includes("/v2/search")) {
        try {
          const u = new URL(url);
          if (u.pathname.includes(`/${LOJA_ID}/`)) {
            storePath = u.pathname;
          }
        } catch {}
      }
      const headersReq = req.headers();
      const tkSearch = headersReq["x-osuper-search-token"];
      const tkId = headersReq["x-osuper-identity-token"];
      const tk = tkSearch || tkId;
      if (tk && tk !== tokenCapturado) {
        if (tk.startsWith(`v1.${CONTA_ID}.${LOJA_ID}.`) || !tk.startsWith("v1.")) {
          tokenCapturado = tk;
          persistirTokenFirebase(tokenCapturado);
        }
      }
    });

    page.on("response", async (res) => {
      try {
        const url = res.url();
        if (EH_ANGELONI) {
          if ((url.includes("/intelligent-search/product_search") || url.includes("operationName=productSearchV3") || url.includes("/api/catalog_system/pub/products/search")) && res.status() >= 200 && res.status() < 300) {
            const bruto = await res.json().catch(() => null);
            const norm = normalizarRespostaAngeloni(bruto);
            if (norm && Array.isArray(norm.hits) && norm.hits.length > 0) {
              filaRespostasInterceptadas.push({ url, data: norm, ts: Date.now() });
              if (filaRespostasInterceptadas.length > 30) filaRespostasInterceptadas.shift();
            }
          }
          return;
        }
        if (url.includes("sense.osuper.com.br") && url.includes("/v2/search") && res.status() === 200) {
          const dadosJson = await res.json().catch(() => null);
          if (dadosJson && (Array.isArray(dadosJson.hits) || Array.isArray(dadosJson.products))) {
            filaRespostasInterceptadas.push({ url, data: dadosJson, ts: Date.now() });
            if (filaRespostasInterceptadas.length > 30) filaRespostasInterceptadas.shift();
          }
        }
      } catch {}
    });
  }

  async function renovarSessaoETokenAutomatico(motivoRenovacao = "Token solicitado", urlNavegacao = SITE_URL) {
    try {
      registrarLog("OK", "Sessão", `${motivoRenovacao} — Sincronizando sessão da loja ${LOJA_ID} (${MERCADO_NOME})...`);

      if (EH_ANGELONI) {
        tokenCapturado = ANGELONI_SEGMENT_TOKEN;
        persistirTokenFirebase(tokenCapturado);
        // Sincroniza CEP 88210-000 (Porto Belo - SC • Loja 28) na sessão VTEX se o navegador estiver ativo
        if (browserPronto && page) {
          const urlAlvo = urlNavegacao || SITE_URL;
          await page.goto(urlAlvo, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
          await page.evaluate(async ({ cep, regId }) => {
            try {
              await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  public: {
                    country: { value: "BRA" },
                    postalCode: { value: cep },
                    regionId: { value: regId }
                  }
                })
              });
            } catch {}
          }, { cep: ANGELONI_CEP_PORTO_BELO, regId: ANGELONI_REGION_ID }).catch(() => {});
          await dormirHumano(900);
        }
        registrarLog("OK", "Região Porto Belo", `Sessão Angeloni Porto Belo (Loja 28 • CEP 88210-000 • Region ${ANGELONI_REGION_ID.slice(0, 14)}...) configurada.`);
        return;
      }

      // 1. Coleta rápida do token via HTML da loja (com cookie oficial st_295 ou st_334)
      try {
        const resHome = await fetch(SITE_URL, {
          headers: {
            "User-Agent": userAgentNativo,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cookie": `${COOKIE_LOJA_NOME}=${COOKIE_LOJA_VALOR}`
          },
          signal: AbortSignal.timeout(10000)
        });
        if (resHome.ok) {
          const html = await resHome.text();
          const mEngine = html.match(/"searchEngineToken"\s*:\s*"([^"]+)"/);
          const mIdentity = html.match(/"searchIdentityToken"\s*:\s*"([^"]+)"/);

          if (mEngine && mEngine[1] && mEngine[1].startsWith(`v1.${CONTA_ID}.${LOJA_ID}.`)) {
            tokenCapturado = mEngine[1];
            persistirTokenFirebase(tokenCapturado);
            registrarLog("OK", "Token", `Token ${EH_FORT ? "Fort" : "Koch"} Loja ${LOJA_ID} obtido: ${tokenCapturado.slice(0, 26)}...`);
          } else if (mEngine && mEngine[1]) {
            tokenCapturado = mEngine[1];
            persistirTokenFirebase(tokenCapturado);
          } else if (mIdentity && mIdentity[1]) {
            tokenCapturado = mIdentity[1];
            persistirTokenFirebase(tokenCapturado);
          }
        }
      } catch {}

      // 2. Garante o navegador Chromium aberto e posicionado no domínio do mercado (necessário contra Cloudflare TLS 403)
      await garantirNavegadorFallback();
      const urlAlvo = urlNavegacao || SITE_URL;
      await page.goto(urlAlvo, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
      await dormirHumano(1600);

      const tkEval = await page.evaluate(async () => {
        try {
          return window.INITIAL_STATE?.app?.searchEngineToken || window.INITIAL_STATE?.auth?.searchIdentityToken || "";
        } catch {
          return "";
        }
      });

      if (tkEval && (tkEval.startsWith(`v1.${CONTA_ID}.${LOJA_ID}.`) || !tokenCapturado)) {
        tokenCapturado = tkEval;
        persistirTokenFirebase(tokenCapturado);
        registrarLog("OK", "Token", `Sessão do navegador sincronizada (X-Osuper-Search-Token Loja ${LOJA_ID}).`);
      }

      // Simula leve rolagem inicial para aquecer listeners da página
      await page.evaluate(() => window.scrollBy(0, 350)).catch(() => {});
      await dormirHumano(600);
    } catch (e) {
      registrarLog("AVISO", "Token", `Oscilação ao sincronizar sessão: ${e.message}`);
    }
  }

  // Motor Nativo curl (HTTP/2 + TLS libcurl que passa pelo Cloudflare sem bloqueio de Undici)
  async function executarMotorCurl(url, refererUrl) {
    const bin = process.platform === "win32" ? "curl.exe" : "curl";
    const args = [
      "-s",
      "-L",
      "--compressed",
      "--max-time", "14",
      "-w", "\n__HTTP_STATUS__:%{http_code}",
      "-H", "Accept: application/json, text/plain, */*",
      "-H", "Accept-Language: pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "-H", `User-Agent: ${userAgentNativo}`,
      "-H", `Origin: ${SITE_URL}`,
      "-H", `Referer: ${refererUrl || `${SITE_URL}/`}`,
      "-H", `sec-ch-ua: "Chromium";v="${versaoChrome}", "Google Chrome";v="${versaoChrome}", "Not?A_Brand";v="99"`,
      "-H", "sec-ch-ua-mobile: ?0",
      "-H", 'sec-ch-ua-platform: "Windows"',
      "-H", "Sec-Fetch-Dest: empty",
      "-H", "Sec-Fetch-Mode: cors",
      "-H", "Sec-Fetch-Site: same-site"
    ];
    if (EH_ANGELONI) {
      args.push("-H", `Cookie: vtex_segment=${ANGELONI_SEGMENT_TOKEN}`);
    } else if (tokenCapturado) {
      args.push("-H", `x-osuper-search-token: ${tokenCapturado}`);
    }
    args.push(url);

    try {
      const { stdout } = await execFileAsync(bin, args, { maxBuffer: 10 * 1024 * 1024, timeout: 16000 });
      const texto = String(stdout || "");
      const marcador = "\n__HTTP_STATUS__:";
      const idx = texto.lastIndexOf(marcador);
      if (idx === -1) return { ok: false, status: 0, error: "Sem código HTTP no curl" };
      const corpo = texto.slice(0, idx).trim();
      const status = Number(texto.slice(idx + marcador.length).trim()) || 0;
      if (status >= 200 && status < 300 && (corpo.startsWith("{") || corpo.startsWith("["))) {
        const rawData = JSON.parse(corpo);
        const data = EH_ANGELONI ? normalizarRespostaAngeloni(rawData) : rawData;
        return { ok: true, status: 200, data, motor: "curl_http2" };
      }
      return { ok: false, status, error: `HTTP ${status} (curl)` };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  }

  // Motor Navegador Chromium (executa window.fetch dentro do contexto real da página do supermercado)
  async function executarMotorPlaywrightEval(url) {
    try {
      await garantirNavegadorFallback();
      const res = await page.evaluate(async ({ targetUrl, tk, ehAng }) => {
        try {
          const h = { accept: "application/json, text/plain, */*" };
          if (!ehAng) {
            const tokenEfetivo = tk || window.INITIAL_STATE?.app?.searchEngineToken || window.INITIAL_STATE?.auth?.searchIdentityToken || "";
            if (tokenEfetivo) {
              h["x-osuper-search-token"] = tokenEfetivo;
            }
          }
          const r = await fetch(targetUrl, { method: "GET", headers: h, mode: "cors", credentials: ehAng ? "include" : "omit" });
          if (!r.ok) return { ok: false, status: r.status, error: `HTTP ${r.status}` };
          const data = await r.json();
          return { ok: true, status: 200, data, motor: "playwright_eval" };
        } catch (err) {
          return { ok: false, status: 0, error: err.message };
        }
      }, { targetUrl: url, tk: tokenCapturado, ehAng: EH_ANGELONI });
      if (res && res.ok && res.data && EH_ANGELONI) {
        res.data = normalizarRespostaAngeloni(res.data);
      }
      return res || { ok: false, status: 0, error: "Eval vazio" };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  }

  // Motor Fetch Node.js Direto
  async function executarMotorNodeFetch(url, refererUrl) {
    try {
      const headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": userAgentNativo,
        "Origin": SITE_URL,
        "Referer": refererUrl || `${SITE_URL}/`
      };
      if (EH_ANGELONI) {
        headers["Cookie"] = `vtex_segment=${ANGELONI_SEGMENT_TOKEN}`;
      } else if (tokenCapturado) {
        headers[HEADER_TOKEN_NAME] = tokenCapturado;
      }
      const res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const rawData = await res.json();
        const data = EH_ANGELONI ? normalizarRespostaAngeloni(rawData) : rawData;
        return { ok: true, status: 200, data, motor: "node_fetch" };
      }
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    } catch (e) {
      return { ok: false, status: 0, error: e.message };
    }
  }

  sessao.status = "RODANDO";
  sessao.mensagem = `Máquina #${WORKER_ID}/${TOTAL_WORKERS} (${WORKER_PUBLIC_IP}) conectando ao ${MERCADO_NOME}...`;
  await enviarTelemetriaAoVivo(true);

  await renovarSessaoETokenAutomatico("Inicialização do Robô", SITE_URL);

  async function consultarAPINoPontoExato(url, rotulo, pag, from, refererUrl = "") {
    let tentativa = 0;
    while (!sessao.pularRotaAtual && !sessao.canceladoRemoto) {
      tentativa++;
      await aguardarSePausadoRemoto();
      if (sessao.pularRotaAtual || sessao.canceladoRemoto) return null;

      sessao.requisicoesFeitas++;
      let resultado = { ok: false, status: 0, error: "Sem resposta" };

      // Ordem inteligente de motores: testa o motor preferido primeiro e, se der QUALQUER erro (inclusive 403!), tenta os outros imediatamente na mesma tentativa!
      const todosMotores = ["playwright_eval", "curl_http2", "node_fetch"];
      const filaMotores = [motorPreferido, ...todosMotores.filter((m) => m !== motorPreferido)];

      for (const nomeMotor of filaMotores) {
        let tentativaMotor = { ok: false, status: 0 };
        if (nomeMotor === "playwright_eval") {
          tentativaMotor = await executarMotorPlaywrightEval(url);
        } else if (nomeMotor === "curl_http2") {
          tentativaMotor = await executarMotorCurl(url, refererUrl);
        } else {
          tentativaMotor = await executarMotorNodeFetch(url, refererUrl);
        }

        if (tentativaMotor && tentativaMotor.ok && tentativaMotor.data) {
          resultado = tentativaMotor;
          if (motorPreferido !== nomeMotor) {
            motorPreferido = nomeMotor;
            registrarLog("OK", "Motor Adaptativo", `Motor alternado automaticamente para [${nomeMotor}] com sucesso (HTTP 200).`);
          }
          break;
        }
        if (tentativaMotor && tentativaMotor.status > 0) {
          resultado = tentativaMotor;
        } else if (!resultado.status && tentativaMotor) {
          resultado = tentativaMotor;
        }
      }

      if (resultado.ok && resultado.data) {
        if (sessao.status === "BLOQUEIO_ESPERA") sessao.status = "RODANDO";
        return resultado.data;
      }

      // Se houve erro (401, 403, 429, 0 ou 5xx), navega o browser para o link real da categoria para renovar cookies/token e tentar novamente
      if (tentativa === 1) {
        registrarLog("AVISO", rotulo, `Oscilação (${resultado.error || `HTTP ${resultado.status}`}) na Pág ${pag}. Abrindo link direto da categoria no navegador para renovar sessão...`);
        await renovarSessaoETokenAutomatico(`Renovação direta em ${rotulo}`, refererUrl || SITE_URL);
        await dormirHumano(1800);
        continue;
      } else if (tentativa === 2) {
        registrarLog("AVISO", rotulo, `Nova tentativa na Pág ${pag} após sincronização de página...`);
        await dormirHumano(3000);
        continue;
      } else {
        return null;
      }
    }
    return null;
  }

  // =========================================================================
  // MOTOR DE NAVEGAÇÃO DIRETA NO LINK DA CATEGORIA + ROLAGEM SIMULADA DE PÁGINA
  // =========================================================================
  async function coletarCategoriaPorRolagemNoNavegador(rota, rotulo, rIdx) {
    try {
      await garantirNavegadorFallback();
      filaRespostasInterceptadas = [];
      registrarLog("OK", rotulo, `🌐 Navegando diretamente para a categoria e simulando rolagem de página: ${rota.url}`);

      await page.goto(rota.url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
      await dormirHumano(2500);

      // Atualiza o token a partir do estado ao vivo da página da categoria recém-aberta
      const tkDaPagina = await page.evaluate(() => {
        try {
          return window.INITIAL_STATE?.app?.searchEngineToken || window.INITIAL_STATE?.auth?.searchIdentityToken || "";
        } catch {
          return "";
        }
      }).catch(() => "");
      if (tkDaPagina && (tkDaPagina.startsWith(`v1.${CONTA_ID}.${LOJA_ID}.`) || !tokenCapturado)) {
        tokenCapturado = tkDaPagina;
        persistirTokenFirebase(tokenCapturado);
      }

      let totalLidosRolagem = 0;
      let novosRolagem = 0;
      let precosRolagem = 0;
      let pagRolagem = 1;
      let totalEsperadoCat = null;
      const urlsJaProcessadas = new Set();

      // 1. Simula rolagem humana progressiva na página para acionar o IntersectionObserver / useInfiniteQuery da categoria
      for (let passoScroll = 1; passoScroll <= 25 && !sessao.pularRotaAtual && !sessao.canceladoRemoto; passoScroll++) {
        await aguardarSePausadoRemoto();
        if (sessao.pularRotaAtual || sessao.canceladoRemoto) break;

        // Processa quaisquer pacotes /v2/search interceptados do tráfego da própria página
        while (filaRespostasInterceptadas.length > 0) {
          const pacote = filaRespostasInterceptadas.shift();
          if (!pacote || !pacote.data || urlsJaProcessadas.has(pacote.url)) continue;
          urlsJaProcessadas.add(pacote.url);

          if (totalEsperadoCat === null && typeof pacote.data.total === "number") {
            totalEsperadoCat = pacote.data.total;
          }
          const hits = Array.isArray(pacote.data.hits)
            ? pacote.data.hits
            : (Array.isArray(pacote.data.products) ? pacote.data.products : []);
          if (hits.length > 0) {
            const resHits = processarHits(hits, rota);
            totalLidosRolagem += hits.length;
            novosRolagem += resHits.novosLote;
            precosRolagem += resHits.precosLote;
            sessao.paginaAtual = pagRolagem;
            if (sessao.progressoRotas[rIdx]) {
              sessao.progressoRotas[rIdx].lidos = totalLidosRolagem;
              sessao.progressoRotas[rIdx].novos = novosRolagem;
              sessao.progressoRotas[rIdx].precos = precosRolagem;
              sessao.progressoRotas[rIdx].pags = pagRolagem;
            }
            pagRolagem++;
          }
        }

        // Faz scroll na janela e clica em botões de "Carregar mais" se existirem
        const statusScroll = await page.evaluate(() => {
          window.scrollBy({ top: 950, behavior: "smooth" });
          const btns = Array.from(document.querySelectorAll("button, a"));
          const btnMais = btns.find((b) => /carregar mais|ver mais|mostrar mais/i.test(b.textContent || ""));
          if (btnMais) {
            try { btnMais.click(); } catch {}
          }
          const chegouFim = (window.innerHeight + window.scrollY) >= (document.body.scrollHeight - 150);
          return { chegouFim, altura: document.body.scrollHeight };
        }).catch(() => ({ chegouFim: true, altura: 0 }));

        await dormirHumano(1200);

        if (filaRespostasInterceptadas.length === 0 && statusScroll.chegouFim && passoScroll >= 3) {
          break;
        }
      }

      // 2. Se a página for um Departamento Nível 1 (carrossel) ou se ainda faltarem itens após o scroll, pagina de dentro da própria página aberta!
      if ((totalLidosRolagem === 0 || (totalEsperadoCat !== null && totalLidosRolagem < totalEsperadoCat)) && !sessao.pularRotaAtual && !sessao.canceladoRemoto) {
        const ehPromo = rota.tipo === "promocoes" || rota.tipo === "promocao";
        const catId = (rota.id && rota.id !== "PROMO_FORT" && rota.id !== "PROMO_KOCH") ? String(rota.id) : "";
        const hier = rota.hierarquia || rota.depto || "";
        let offsetDom = totalLidosRolagem;

        while (!sessao.pularRotaAtual && !sessao.canceladoRemoto) {
          await aguardarSePausadoRemoto();
          const urlPagDom = montarUrlOficial({
            storePath,
            promo: ehPromo,
            size: CONFIG.size,
            from: offsetDom,
            pag: pagRolagem,
            rota,
            categoryId: catId,
            categoryName: (!ehPromo && !catId) ? hier : ""
          });
          const resDom = await executarMotorPlaywrightEval(urlPagDom);
          if (!resDom.ok || !resDom.data) break;
          const hitsDom = Array.isArray(resDom.data.hits) ? resDom.data.hits : (Array.isArray(resDom.data.products) ? resDom.data.products : []);
          if (hitsDom.length === 0) break;

          const rHits = processarHits(hitsDom, rota);
          totalLidosRolagem += hitsDom.length;
          novosRolagem += rHits.novosLote;
          precosRolagem += rHits.precosLote;
          offsetDom += hitsDom.length;
          sessao.paginaAtual = pagRolagem;
          if (sessao.progressoRotas[rIdx]) {
            sessao.progressoRotas[rIdx].lidos = totalLidosRolagem;
            sessao.progressoRotas[rIdx].novos = novosRolagem;
            sessao.progressoRotas[rIdx].precos = precosRolagem;
            sessao.progressoRotas[rIdx].pags = pagRolagem;
          }
          pagRolagem++;
          await page.evaluate(() => window.scrollBy(0, 600)).catch(() => {});
          await enviarTelemetriaAoVivo(false);
          if (hitsDom.length < CONFIG.size) break;
          if (typeof resDom.data.total === "number" && offsetDom >= resDom.data.total) break;
          await dormirHumano(CONFIG.delayMs);
        }
      }

      return { lidos: totalLidosRolagem, novos: novosRolagem, precos: precosRolagem, pags: Math.max(1, pagRolagem - 1) };
    } catch (e) {
      registrarLog("AVISO", rotulo, `Oscilação na rolagem direta: ${e.message}`);
      return { lidos: 0, novos: 0, precos: 0, pags: 1 };
    }
  }

  // =======================================================================
  // LAÇO PRINCIPAL: ROTAS E FATIAS BALANCEADAS POR VOLUME DE ITENS
  // =======================================================================
  try {
    const indicesFatia = Array.isArray(sessao.minhasRotasIndices) && sessao.minhasRotasIndices.length > 0
      ? [...sessao.minhasRotasIndices]
      : (() => {
          const arr = [];
          for (let i = Math.max(sessao.meuIndiceInicio, sessao.rotaIndiceAtual); i <= sessao.meuIndiceFim; i++) arr.push(i);
          return arr;
        })();

    const indicesPrioritarios = [...indicesFatia];
    let cursorInicial = 0;
    if (EH_MODO_24H && TOTAL_WORKERS <= 1 && sessao.rotaIndiceAtual > 0) {
      const posRetomada = indicesPrioritarios.indexOf(sessao.rotaIndiceAtual);
      if (posRetomada >= 0) cursorInicial = posRetomada;
    }

    for (let cursor = cursorInicial; cursor < indicesPrioritarios.length; cursor++) {
      let rIdx = indicesPrioritarios[cursor];
      await verificarComandosRemotos();
      await aguardarSePausadoRemoto();
      if (sessao.canceladoRemoto) break;

      const checkPausa = devePausarParaProximaOperacao();
      if (checkPausa.pausar) {
        registrarLog("OK", "Pausa Programada", `⏰ ${checkPausa.motivo}. Salvando cursor (${rIdx}) e finalizando ciclo.`);
        await salvarCursor24hRemoto(rIdx, 0, false, 1);
        sessao.status = "CONCLUIDO";
        sessao.mensagem = `Transição: ${checkPausa.motivo}. Cursor salvo para próxima rodada.`;
        await enviarTelemetriaAoVivo(true);
        if (SOU_MAESTRO) {
          await absorverEnxameNoMaestro();
          await gravarComSegurancaNoFirebase(`Pausa Programada (${checkPausa.motivo})`);
        }
        process.exit(0);
      }

      if (sessao.irParaRotaIndice !== null && sessao.irParaRotaIndice >= 0) {
        const alvo = Math.max(0, Math.min(ROTAS_ATIVAS.length - 1, sessao.irParaRotaIndice));
        sessao.irParaRotaIndice = null;
        const posNaFila = indicesPrioritarios.indexOf(alvo);
        if (posNaFila !== -1) {
          cursor = posNaFila;
          rIdx = indicesPrioritarios[cursor];
        } else {
          rIdx = alvo;
        }
      }

      sessao.pularRotaAtual = false;
      const rota = ROTAS_ATIVAS[rIdx];
      if (!rota) continue;

      const offsetInicioRota = (EH_MODO_24H && TOTAL_WORKERS <= 1 && sessao.offsetRetomada24h > 0)
        ? sessao.offsetRetomada24h
        : Number(rota.offsetInicioFatia || 0);
      const pagInicioRota = (EH_MODO_24H && TOTAL_WORKERS <= 1 && sessao.pagRetomada24h > 1)
        ? sessao.pagRetomada24h
        : Number(rota.pagInicioFatia || 1);

      // Limpa retomada parcial de página após consumir na primeira rota
      sessao.offsetRetomada24h = 0;
      sessao.pagRetomada24h = 1;

      const offsetLimiteFatia = typeof rota.offsetFimFatia === "number" && rota.offsetFimFatia > 0 ? rota.offsetFimFatia : null;
      const pagLimiteFatia = typeof rota.pagFimFatia === "number" && rota.pagFimFatia > 0 ? rota.pagFimFatia : null;

      sessao.rotaIndiceAtual = rIdx;
      sessao.rotaNomeAtual = rota.nome;
      sessao.rotaUrlAtual = rota.url;
      sessao.deptoAtualNome = rota.depto || "Geral";
      sessao.paginaAtual = pagInicioRota;
      sessao.totalPaginasEstimadoRota = pagLimiteFatia || Math.max(1, Math.ceil((rota.pesoEstimado || 40) / CONFIG.size));
      sessao.offsetAtual = offsetInicioRota;

      const rotulo = `Rota #${rIdx + 1}/${ROTAS_ATIVAS.length} • ${rota.nome}`;
      registrarLog("OK", rotulo, `Iniciando coleta da seção: ${rota.url} (Pág inicial ${pagInicioRota} • Offset ${offsetInicioRota})`);

      // Só navega antes da Pág 1 se ainda não tiver token capturado (evita 140 carregamentos desnecessários de HTML)
      if (!tokenCapturado && browserPronto && page && rota.url) {
        try {
          filaRespostasInterceptadas = [];
          await page.goto(rota.url, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
          await dormirHumano(900);
        } catch {}
      }

      sessao.progressoRotas[rIdx] = {
        st: "rodando",
        nome: rota.nome,
        nomeBase: rota.nomeBase || rota.nome,
        pathReal: rota.pathReal || "",
        tipo: rota.tipo || "sub",
        depto: rota.depto,
        url: rota.url,
        lidos: 0,
        novos: 0,
        precos: 0,
        pags: pagInicioRota,
        fatiaIndex: rota.fatiaIndex || 1,
        fatiaTotal: rota.fatiaTotal || 1,
        totalCategoriaSite: rota.pesoTotalCategoria || rota.pesoEstimado || 0,
        inicioEm: horaAtualBR(),
        worker: WORKER_ID
      };

      await enviarTelemetriaAoVivo(true);

      const ehHomeOuIndex = rota.tipo === "home" || rota.tipo === "categorias_index";
      const ehPromo = rota.tipo === "promocoes" || rota.tipo === "promocao";

      let from = offsetInicioRota;
      let pag = pagInicioRota;
      let totalItensEstimado = null;
      let totalLidosRota = 0;
      let novosRota = 0;
      let precosRota = 0;

      const hierarquiaOficial = rota.hierarquia || ((rota.tipo === "depto" && rota.depto) ? rota.depto : "");
      let usarFiltroPorHierarquia = !rota.id || rota.id === "PROMO_FORT" || rota.id === "PROMO_KOCH";
      const categoryIdParam = (rota.id && rota.id !== "PROMO_FORT" && rota.id !== "PROMO_KOCH") ? String(rota.id) : "";

      while (!sessao.pularRotaAtual && !sessao.canceladoRemoto) {
        await verificarComandosRemotos();
        await aguardarSePausadoRemoto();
        if (sessao.pularRotaAtual || sessao.canceladoRemoto) break;

        sessao.paginaAtual = pag;
        sessao.offsetAtual = from;

        const urlAPI = montarUrlOficial({
          storePath,
          promo: ehPromo,
          size: CONFIG.size,
          from,
          pag,
          rota,
          usarCatalogFallback: EH_ANGELONI && usarFiltroPorHierarquia,
          categoryId: usarFiltroPorHierarquia ? "" : categoryIdParam,
          categoryName: (!ehPromo && (usarFiltroPorHierarquia || !categoryIdParam)) ? hierarquiaOficial : ""
        });

        sessao.status = "RODANDO";
        sessao.mensagem = `Coletando ${rota.nome} • Pág ${pag} (off ${from}) • ${mapaProdutos.size} prods no banco...`;
        await enviarTelemetriaAoVivo(false);

        let dados = await consultarAPINoPontoExato(urlAPI, rotulo, pag, from, rota.url);

        // Fallback 1 na Pág Inicial da Fatia: Se categoryId/IntelligentSearch retornou 0 itens ou falhou, tenta pelo nome hierárquico / Catalog System
        const hitsIniciais = dados ? (Array.isArray(dados.hits) ? dados.hits : (Array.isArray(dados.products) ? dados.products : [])) : [];
        if (pag === pagInicioRota && hitsIniciais.length === 0 && (!ehPromo || EH_ANGELONI) && (hierarquiaOficial || EH_ANGELONI) && !usarFiltroPorHierarquia) {
          usarFiltroPorHierarquia = true;
          const urlHierarquia = montarUrlOficial({
            storePath,
            promo: ehPromo,
            size: CONFIG.size,
            from,
            pag,
            rota,
            usarCatalogFallback: EH_ANGELONI,
            categoryId: categoryIdParam,
            categoryName: hierarquiaOficial
          });
          const dadosHier = await consultarAPINoPontoExato(urlHierarquia, rotulo, pag, from, rota.url);
          if (dadosHier) {
            dados = dadosHier;
          }
        }

        // Fallback 2: Se a API direta não respondeu ou veio vazia na Pág 1 (from === 0), abre o link direto da categoria no navegador e faz rolagem!
        const hitsVerificados = dados ? (Array.isArray(dados.hits) ? dados.hits : (Array.isArray(dados.products) ? dados.products : [])) : [];
        if (from === 0 && pag === 1 && (!dados || hitsVerificados.length === 0)) {
          const resRolagem = await coletarCategoriaPorRolagemNoNavegador(rota, rotulo, rIdx);
          if (resRolagem.lidos > 0) {
            totalLidosRota += resRolagem.lidos;
            novosRota += resRolagem.novos;
            precosRota += resRolagem.precos;
            pag = resRolagem.pags + 1;
            await verificarAutoSaveInteligente(`${rota.nome} (Rolagem)`, false);
            await enviarTelemetriaAoVivo(false);
            break;
          }
          if (!dados) {
            registrarLog("AVISO", rotulo, `Sem resposta na Pág ${pag}. Avançando para a próxima categoria.`);
            break;
          }
        }

        if (!dados) {
          registrarLog("AVISO", rotulo, `Fim da paginação em ${rota.nome} (Pág ${pag}).`);
          break;
        }

        const hits = Array.isArray(dados.products)
          ? dados.products
          : (Array.isArray(dados.hits) ? dados.hits : (Array.isArray(dados.items) ? dados.items : []));

        if (totalItensEstimado === null && typeof dados.total === "number") {
          totalItensEstimado = dados.total;
          const totalPagsGlobalCat = Math.max(1, Math.ceil(totalItensEstimado / CONFIG.size));
          sessao.totalPaginasEstimadoRota = pagLimiteFatia ? Math.min(pagLimiteFatia, totalPagsGlobalCat) : totalPagsGlobalCat;
        }

        if (hits.length === 0) {
          if (pag === pagInicioRota) {
            registrarLog("OK", rotulo, `Fatia/Categoria concluída sem itens adicionais nesta faixa (off ${from}).`);
          }
          break;
        }

        const resHits = processarHits(hits, rota);
        totalLidosRota += hits.length;
        novosRota += resHits.novosLote;
        precosRota += resHits.precosLote;

        if (sessao.progressoRotas[rIdx]) {
          sessao.progressoRotas[rIdx].lidos = totalLidosRota;
          sessao.progressoRotas[rIdx].novos = novosRota;
          sessao.progressoRotas[rIdx].precos = precosRota;
          sessao.progressoRotas[rIdx].pags = pag;
          if (totalItensEstimado !== null) {
            sessao.progressoRotas[rIdx].totalCategoriaSite = totalItensEstimado;
          }
        }

        await verificarAutoSaveInteligente(`${rota.nome} Pág ${pag}`, false);
        await enviarTelemetriaAoVivo(false);

        const proxFrom = from + hits.length;
        const proxPag = pag + 1;

        const checkPausaPag = devePausarParaProximaOperacao();
        if (checkPausaPag.pausar) {
          registrarLog("OK", "Pausa Programada", `⏰ ${checkPausaPag.motivo}. Salvando cursor exato (Rota #${rIdx + 1}, Pág ${proxPag}, Off ${proxFrom}) e finalizando turno.`);
          await salvarCursor24hRemoto(rIdx, proxFrom, false, proxPag);
          sessao.status = "CONCLUIDO";
          sessao.mensagem = `Transição: ${checkPausaPag.motivo}. Cursor salvo para próxima rodada.`;
          await enviarTelemetriaAoVivo(true);
          if (SOU_MAESTRO) {
            await absorverEnxameNoMaestro();
            await gravarComSegurancaNoFirebase(`Pausa Programada (${checkPausaPag.motivo})`);
          }
          process.exit(0);
        }

        from = proxFrom;
        pag = proxPag;

        if (ehHomeOuIndex) {
          if (pag > 3) break;
        }

        if (hits.length < CONFIG.size) {
          break;
        }

        if (offsetLimiteFatia !== null && from >= offsetLimiteFatia) {
          break;
        }

        if (pagLimiteFatia !== null && pag > pagLimiteFatia) {
          break;
        }

        if (totalItensEstimado !== null && from >= totalItensEstimado) {
          break;
        }

        await dormirHumano(CONFIG.delayMs);
      }

      // Rede de Segurança de Subcategorias: se uma Categoria Inteira (depto) na fatia inicial retornou 0 itens, varre automaticamente suas subcategorias!
      if (totalLidosRota === 0 && offsetInicioRota === 0 && rota.tipo === "depto" && !sessao.pularRotaAtual && !sessao.canceladoRemoto) {
        const listaCompletaMercado = EH_ANGELONI
          ? ROTAS_PADRAO_ANGELONI
          : (EH_FORT ? ROTAS_PADRAO_FORT : ROTAS_PADRAO_KOCH);
        const subRotasDepto = listaCompletaMercado.filter((sr) => sr.tipo === "sub" && sr.depto === rota.depto);
        if (subRotasDepto.length > 0) {
          registrarLog("AVISO", rotulo, `Ativando varredura de segurança nas ${subRotasDepto.length} subcategorias de ${rota.depto}...`);
          for (const subRota of subRotasDepto) {
            if (sessao.pularRotaAtual || sessao.canceladoRemoto) break;
            let fromSub = 0;
            let pagSub = 1;
            while (!sessao.pularRotaAtual && !sessao.canceladoRemoto) {
              await aguardarSePausadoRemoto();
              const subCatId = (subRota.id && subRota.id !== "PROMO_FORT" && subRota.id !== "PROMO_KOCH") ? String(subRota.id) : "";
              const urlSub = montarUrlOficial({
                storePath,
                promo: false,
                size: CONFIG.size,
                from: fromSub,
                pag: pagSub,
                rota: subRota,
                categoryId: subCatId,
                categoryName: !subCatId ? (subRota.hierarquia || "") : ""
              });
              const dSub = await consultarAPINoPontoExato(urlSub, `${rotulo} > ${subRota.nome}`, pagSub, fromSub, subRota.url);
              if (!dSub) break;
              const hSub = Array.isArray(dSub.hits) ? dSub.hits : (Array.isArray(dSub.products) ? dSub.products : []);
              if (hSub.length === 0) break;
              const rSub = processarHits(hSub, subRota);
              totalLidosRota += hSub.length;
              novosRota += rSub.novosLote;
              precosRota += rSub.precosLote;
              fromSub += hSub.length;
              pagSub++;
              if (hSub.length < CONFIG.size) break;
              if (typeof dSub.total === "number" && fromSub >= dSub.total) break;
              await dormirHumano(CONFIG.delayMs);
            }
          }
        }
      }

      const pagsLidasFatia = Math.max(1, pag - pagInicioRota);
      sessao.progressoRotas[rIdx] = {
        st: sessao.pularRotaAtual ? "skip" : "ok",
        nome: rota.nome,
        nomeBase: rota.nomeBase || rota.nome,
        pathReal: rota.pathReal || "",
        tipo: rota.tipo || "sub",
        depto: rota.depto,
        url: rota.url,
        lidos: totalLidosRota,
        novos: novosRota,
        precos: precosRota,
        pags: pagsLidasFatia,
        fatiaIndex: rota.fatiaIndex || 1,
        fatiaTotal: rota.fatiaTotal || 1,
        totalCategoriaSite: totalItensEstimado || Math.max(totalLidosRota, rota.pesoTotalCategoria || 0),
        fimEm: horaAtualBR(),
        worker: WORKER_ID
      };

      registrarLog("OK", rotulo, `Concluída: ${totalLidosRota} itens em ${pagsLidasFatia} pág(s) (+${novosRota} novos | 🔄 ${precosRota} preços).`);

      await verificarAutoSaveInteligente(rota.nome, true);

      if (SOU_MAESTRO && (rota.tipo === "depto" || rota.tipo === "promocoes" || rota.tipo === "promocao") && (sessao.novosDesdeUltimoSave >= CONFIG.salvarAoAdicionar || sessao.atualizadosDesdeUltimoSave >= CONFIG.salvarAoAtualizar)) {
        await gravarComSegurancaNoFirebase(`Fim de ${rota.nome}`);
      }

      await salvarCursor24hRemoto(rIdx, 0, true, 1);
      await enviarTelemetriaAoVivo(true);
      await dormirHumano(CONFIG.delayTrocaRotaMs);

      // Reinício Contínuo do Loop 24H (Mais Acessados + Promoções sem parar)
      if (cursor === indicesPrioritarios.length - 1 && EH_MODO_24H && TOTAL_WORKERS === 1 && !sessao.canceladoRemoto) {
        const checkLoop = devePausarParaProximaOperacao();
        if (!checkLoop.pausar) {
          registrarLog("OK", "Loop 24h", "🔄 Ciclo de Promoções e Mais Acessados concluído! Reordenando pelas seções com mais itens e reiniciando loop contínuo...");
          await salvarPesosCategoriasNoFirebase(sessao.progressoRotas);
          await salvarCursor24hRemoto(0, 0, false, 1);
          sessao.progressoRotas = {};
          cursor = -1;
          continue;
        }
      }
    }

    sessao.minhaFatiaConcluida = true;

    if (!SOU_MAESTRO) {
      sessao.status = "CONCLUIDO";
      sessao.mensagem = `✅ Máquina #${WORKER_ID}/${TOTAL_WORKERS} concluiu suas ${indicesPrioritarios.length} fatias/rotas!`;
      registrarLog("OK", "Fatia Concluída", sessao.mensagem);
      await publicarEstadoWorkerNoEnxame();
      return;
    }

    if (SOU_MAESTRO && TOTAL_WORKERS > 1) {
      registrarLog("OK", "Maestro do Enxame", `Máquina #1 concluiu sua fatia. Coordenando e salvando dados das demais máquinas do enxame...`);
      for (let esperaCiclo = 0; esperaCiclo < 180 && !sessao.canceladoRemoto; esperaCiclo++) {
        await aguardarSePausadoRemoto();
        const enxame = await absorverEnxameNoMaestro(true);
        await verificarAutoSaveInteligente("Sincronização do Enxame", false);
        sessao.mensagem = `⚡ Maestro sincronizando enxame (${enxame.maquinasAtivas} máquina(s) finalizando suas categorias)...`;
        await enviarTelemetriaAoVivo(true);
        if (enxame.todosConcluidos) {
          registrarLog("OK", "Maestro do Enxame", `Todas as ${TOTAL_WORKERS} máquinas do enxame concluíram suas fatias!`);
          break;
        }
        await dormir(5000);
      }
    }

    await gravarComSegurancaNoFirebase("Extração 100% Concluída pelo Enxame");
    const enxameFinal = await absorverEnxameNoMaestro(true);
    await salvarPesosCategoriasNoFirebase(enxameFinal.progressoCombinado);
    await registrarAgendamentoAutoNoFirebase("concluido");

    sessao.status = "CONCLUIDO";
    sessao.mensagem = `🎉 ${MERCADO_NOME} Concluído (${TOTAL_WORKERS} máq. | Modo ${CONFIG.modoFila})! ${mapaProdutos.size} produtos no banco (+${enxameFinal.novosGlobal} novos, 🔄 ${enxameFinal.precosGlobal} preços).`;
    registrarLog("OK", "Finalizado", sessao.mensagem);
    await enviarTelemetriaAoVivo(true);

    // Se ambos os bancos existirem, executa a vinculação inteligente para manter vínculos sempre atualizados
    if (SOU_MAESTRO) {
      try {
        await executarVinculacaoInteligente();
      } catch (eLink) {
        registrarLog("AVISO", "Vinculação", `Vinculação automática pós-extração: ${eLink.message}`);
      }
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

// =========================================================================
// ALGORITMO MULTI-FATOR DE VINCULAÇÃO INTELIGENTE TRIPLA (KOCH × FORT × ANGELONI)
// Regras Rígidas:
// 1. Medida (kg, g, l, ml, un) 100% EXATA
// 2. Marca 100% EXATA (com equivalência de sub-marca quando presente nos 2 títulos)
// 3. Nome do produto o mais parecido possível e bloqueio total de conflito de sabor/variante
// =========================================================================
const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "com", "para", "em", "sem", "ao", "aos",
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "e", "ou", "por", "sobre",
  "no", "na", "nos", "nas", "tipo", "sabor", "pacote", "pct", "pc", "unidade",
  "unid", "un", "unidades", "cx", "caixa", "pote", "pt", "garrafa", "gf", "gfa",
  "lata", "lt", "latinha", "fardo", "fd", "sache", "sch", "sc", "bandeja", "bdj",
  "vidro", "vd", "pet", "tp", "tetra", "pak", "tetrapak", "embalagem", "emb",
  "oferta", "leve", "pague", "especial", "extra", "preco", "novo", "nova",
  "frasco", "fr", "bisnaga", "cartela", "display", "pouch", "long", "neck", "ln"
]);

const MARCAS_NEUTRAS_GRANEL = new Set([
  "generico", "outros", "sem marca", "importado", "horti fruti", "hortifruti",
  "hortifruti koch", "fruta delivery fort", "delivery fort", "koch", "superkoch",
  "super koch", "fort", "fort atacadista", "angeloni", "super angeloni", "cookie", "biscoito",
  "granjeiro", "in natura", "a granel", "granel", "producao propria", "marca propria",
  "padaria", "acougue", "peixaria", "confeitaria", "rotisseria", "fiambreria", "nacional"
]);

const ABREVIACOES_MAP = [
  [/\brefrig\.?\b|\brefri\b/g, "refrigerante"],
  [/\bcerv\.?\b/g, "cerveja"],
  [/\bchoc\.?\b/g, "chocolate"],
  [/\bbisc\.?\b|\bbolacha\b/g, "biscoito"],
  [/\bcookies\b/g, "cookie"],
  [/\bwafers\b/g, "wafer"],
  [/\bmac\.?\b/g, "macarrao"],
  [/\bmiojo\b|\blamen\b/g, "instantaneo"],
  [/\bmarg\.?\b/g, "margarina"],
  [/\breq\.?\b/g, "requeijao"],
  [/\bdeterg\.?\b|\bdet\b/g, "detergente"],
  [/\bamac\.?\b/g, "amaciante"],
  [/\bdesinf\.?\b/g, "desinfetante"],
  [/\balvej\.?\b/g, "alvejante"],
  [/\bdesod\.?\b/g, "desodorante"],
  [/\bcondic\.?\b|\bcond\.?\b/g, "condicionador"],
  [/\bshamp\.?\b|\bsh\b/g, "shampoo"],
  [/\bsab\.?\b/g, "sabonete"],
  [/\bhig\.?\b/g, "higienico"],
  [/\bpap\.?\b/g, "papel"],
  [/\babsorv\.?\b/g, "absorvente"],
  [/\bling\.?\b/g, "linguica"],
  [/\bsals\.?\b/g, "salsicha"],
  [/\bmort\.?\b/g, "mortadela"],
  [/\bpres\.?\b/g, "presunto"],
  [/\bmuss\.?\b|\bmucarela\b|\bmozarela\b/g, "mussarela"],
  [/\bqueij\.?\b|\bqj\b/g, "queijo"],
  [/\biog\.?\b/g, "iogurte"],
  [/\btrad\.?\b/g, "tradicional"],
  [/\borig\.?\b/g, "original"],
  [/\bdesn\.?\b/g, "desnatado"],
  [/\bsemidesn\.?\b/g, "semidesnatado"],
  [/\bint\.?\b/g, "integral"],
  [/\bligth\b/g, "light"],
  [/\bmaisena\b/g, "maizena"],
  [/\bcatchup\b|\bcatsup\b/g, "ketchup"],
  [/\bchopp\b/g, "chope"],
  [/\bsugar\s*free\b|\bpense\s+zero\b/g, "zero"],
  [/\b(sem|zero|0)\s+(adicao\s+de\s+)?(acucar|acucares)\b/g, "zero"],
  [/\b(sem|zero|0)\s+(de\s+)?(gordura|gorduras)\b/g, "zero"],
  [/\b(sem|zero|0)\s+lactose\b|\blacfree\b|\bnolac\b|\bzerolac\b/g, "zero zerolactose"],
  [/\b(sem|zero|0)\s+gluten\b/g, "zerogluten"],
  [/\b(sem|zero|0)\s+alcool\b/g, "zeroalcool"],
  [/\bcom\s+gas\b/g, "comgas"],
  [/\bsem\s+gas\b/g, "semgas"],
  [/\bsem\s+sal\b/g, "semsal"],
  [/\bcom\s+sal\b/g, "comsal"],
  [/\blava[\s-]+roupas?\b/g, "lavaroupas"],
  [/\blava[\s-]+loucas?\b/g, "lavaloucas"],
  [/\bpasta\s+de\s+dente\b|\bpasta\s+dental\b/g, "creme dental"],
  [/\bfronteira\b/g, "frontera"],
  [/\brodabrill\b/g, "rodabril"],
  [/\bc\/\s*/g, "com "],
  [/\bs\/\s*/g, "sem "],
  [/\b3\s+coracoes\b/g, "tres coracoes"],
  [/\bcoca[\s-]+cola\b/g, "coca cola"],
  [/\bdel[\s-]+valle\b/g, "del valle"],
  [/\bdr\.?\s*oetker\b|\bdoutor\s+oetker\b/g, "dr oetker"],
  [/\btixan\s+ype\b/g, "ype"],
  [/\btio\s+urbano\b/g, "urbano"],
  [/\bl[\s']*or\b|\blor\b/g, "lor"],
  [/\bpingo\s+d[\s']*ouro\b/g, "pingo douro"],
  [/\blay[\s']*s\b/g, "lays"],
  [/\bkellogg[\s']*s\b/g, "kelloggs"],
  [/\bhellmann[\s']*s\b/g, "hellmanns"],
  [/\bhershey[\s']*s\b/g, "hersheys"],
  [/\bm\s*&\s*m[\s']*s?\b/g, "mms"],
  [/\bmc\s*cain\b/g, "mccain"]
];

const GRUPOS_CONFLITO_SABOR = [
  ["uva", "laranja", "limao", "morango", "maracuja", "abacaxi", "pessego", "manga", "guarana", "caju", " maca ", "frutas vermelhas", "tutti frutti", "baunilha", "flocos", "coco", "banana", "goiaba", "acerola", "tangerina", "framboesa", "amora", "cereja", "melancia", "melao", "kiwi", "pera", "ameixa"],
  ["chocolate", "baunilha", "morango", "coco", "avela", "caramelo", "doce de leite", "limao", "maracuja", "brigadeiro", "prestigio", " beijinho "],
  ["bovino", "bovina", "frango", "galinha", "suino", "suina", "peixe", "tilapia", "salmao", "peru", "bacalhau", "camarao", "costela", "picanha", "calabresa", "bacon"],
  ["integral", "desnatado", "semidesnatado"],
  ["carioca", "preto", "branco", "vermelho", "fradinho"],
  ["parboilizado", "branco", "integral", "arboreo", "cateto", "negro"],
  ["tinto", "branco", "rose"],
  ["seco", "suave", "demi sec", "brut", "moscatel"],
  ["pilsen", "ipa", "lager", "weiss", "malzbier", "stout", "bock"],
  ["espaguete", "parafuso", "fusilli", "penne", "padre nosso", "ave maria", "cabelo de anjo", "talharim", "fettuccine", "ninho", "lasanha", "conchinha", "gravatinha", "instantaneo", "argolinha", "rigatoni"],
  ["shampoo", "condicionador", "creme de pentear", "mascara", "tintura", "sabonete"],
  ["aerosol", "rollon", "roll on", "stick", "creme"],
  ["caes", "gatos", "cachorro", "gato"],
  ["adulto", "filhote", "senior", "castrado"],
  ["folha dupla", "folha tripla", "folha simples"]
];

// Grupos de sinônimos de tipo base de produto para evitar rejeição quando um mercado omite o prefixo
const GRUPOS_TIPO_EQUIVALENTE = [
  new Set(["biscoito", "cookie", "wafer", "rosquinha", "sequilho", "torrada", "cracker", " salgadinho ", "snack", "batata"]),
  new Set(["macarrao", "massa", "instantaneo", "espaguete", "parafuso", "penne", "talharim", "fettuccine", "lasanha", "ninho", "cabelo", "padre", "ave", "conchinha"]),
  new Set(["sabao", "lavaroupas", "detergente", "lava", "alvejante", "amaciante", "tira"]),
  new Set(["limpador", "multiuso", "desengordurante", "desinfetante", "agua", "cloro", "limpa"]),
  new Set(["queijo", "mussarela", "prato", "parmesao", "provolone", "gouda", "brie", "gorgonzola", "coalho", "minas", "ricota", "requeijao", "catupiry", "cream"]),
  new Set(["presunto", "apresuntado", "mortadela", "salame", "copa", "peito", "blanquet", "lombo", "fatiado"]),
  new Set(["linguica", "calabresa", "toscana", "paio", "salsicha", "pernil", "costelinha", "bacon"]),
  new Set(["frango", "file", "filezinho", "peito", "coxa", "sobrecoxa", "asa", "tulipa", "passarinho", "sassami", "coxinha"]),
  new Set(["carne", "bife", "picanha", "alcatra", "maminha", "contra", "contrafile", "costela", "coxao", "patinho", "acem", "fraldinha", "cupim", "musculo", "paleta", "hamburguer", "almobdega", "almondega"]),
  new Set(["iogurte", "bebida", "leite", "fermentado", "petit", "suisse", "coalhada", "nata", "creme", "chantilly"]),
  new Set(["achocolatado", "composto", "cereal", "aveia", "granola", "farinha", "mingau"]),
  new Set(["refrigerante", "suco", "nectar", "refresco", "agua", "energetico", "isotonico", "cha", "tonica"]),
  new Set(["cerveja", "chope", "vinho", "espumante", "whisky", "vodka", "gin", "cachaca", "aguardente", "licor", "aperitivo", "sidra"]),
  new Set(["pao", "bisnaguinha", "bolo", "torta", "panetone", "panettone", "chocotone", "chocottone", "sonho", "cuca", "rosca"]),
  new Set(["papel", "toalha", "guardanapo", "lenco", "fralda", "absorvente", "algodao", "haste"]),
  new Set(["creme", "pasta", "gel", "escova", "fio", "enxaguante", "antisseptico"]),
  new Set(["shampoo", "condicionador", "sabonete", "desodorante", "hidratante", "locao", "oleo"]),
  new Set(["molho", "extrato", "polpa", "passata", "ketchup", "mostarda", "maionese", "tempero", "caldo", "vinagre", "azeite"]),
  new Set(["chocolate", "bombom", "tablete", "barra", "trufa", "bala", "chicle", "goma", "pirulito", "confeito", "drops"]),
  new Set(["sorvete", "picole", "acai", "sobremesa", "gelato"]),
  new Set(["pizza", "lasanha", "escondidinho", "empanado", "nuggets", "tekitos", "steak", "prato", "sanduiche", "hot"]),
  new Set(["racao", "alimento", "petisco", "bifinho", "sache", "areia", "tapete"])
];

// Marcas corporativas (conglomerados) e suas sub-marcas diretas
const SUBMARCAS_CONHECIMENTOS = new Set([
  "nescau", "ninho", "moca", "kitkat", "passatempo", "bono", "nescafe", "maggi", "garoto",
  "chambinho", "chandelle", "mucilon", "farinha lactea", "chokito", "prestigio", "alpino", "suflair", "galak", "classic", "charge", "lollo", "negresco", "tostines", "purina", "dog chow", "cat chow", "friskies", "fancy feast",
  "oreo", "bis", "lacta", "tang", "clight", "trident", "halls", "club social", "philadelphia", "royal", "diamante negro", "laka", "ouro branco", "sonho de valsa", "trakinas", "belvita",
  "elma chips", "ruffles", "doritos", "cheetos", "fandangos", "lays", "pingo douro", "cebolitos", "baconzitos", "stiksy", "sensacoes", "quaker", "toddy", "toddynho", "kero coco", "gatorade", "h2oh", "pepsi",
  "omo", "comfort", "brilhante", "cif", "seda", "dove", "rexona", "lux", "clear", "hellmanns", "knorr", "maizena", "kibon", "arisco", "fofo", "surf", "axe", "suave", "closeup", "close up", "tresemme",
  "veja", "vanish", "sbp", "bom ar", "harpic", "finish", "dettol", "poliflor", "nugget", "mortein", "veet",
  "gillette", "oral b", "pampers", "always", "pantene", "downy", "ariel", "head shoulders", "aussie", "old spice", "vick",
  "del valle", "kapo", "schweppes", "fanta", "sprite", "crystal", "monster", "ades", "powerade", "kuat",
  "brahma", "skol", "antarctica", "stella artois", "budweiser", "corona", "spaten", "original", "bohemia", "patagonia", "colorado", "becks", "guarana antarctica",
  "heineken", "amstel", "eisenbahn", "devassa", "baden baden", "schin", "glacial", "kaiser", "fys", "itubaina",
  "sadia", "perdigao", "qualy", "deline", "claybom", "chester",
  "seara", "doriana", "friboi", "maturatta", "swift", "massa leve", "rezende", "confianca",
  "bauducco", "visconti", "tommy",
  "ype", "tixan", "atol", "assolan", "perfex",
  "colgate", "palmolive", "sorriso", "protex", "ajax", "pinho sol", "ola", "tandy", "elmex",
  "johnson", "johnsons", "listerine", "neutrogena", "sundown", "sempre livre", "carefree", "cotonetes", "band aid",
  "glade", "raid", "off", "pato", "mr musculo", "bravo", "ziploc", "baygon",
  "neve", "scott", "duramax", "huggies", "intimus", "plenitud", "kleenex"
]);

function normalizarTexto(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.,/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarTextoVinculo(str) {
  let s = normalizarTexto(str)
    .replace(/[-/.,_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const [rgx, sub] of ABREVIACOES_MAP) {
    s = s.replace(rgx, sub);
  }
  return s.replace(/\s+/g, " ").trim();
}

function normalizarMarcaVinculo(marca) {
  const m = normalizarTextoVinculo(marca)
    .replace(/\b(s\s*a|ltda|brasil|alimentos|bebidas|laticinios|industria|comercio|cia|grupo|supermercados|supermercado|atacadista|delivery|cosm|cosmeticos)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!m || MARCAS_NEUTRAS_GRANEL.has(m)) return "";
  return m;
}

function resolverMarcaCanonica(marcaNorm, nomeNorm) {
  const padNome = ` ${nomeNorm} `;
  // Se a marca já é uma sub-marca específica ou marca direta
  if (marcaNorm && !["nestle", "mondelez", "pepsico", "unilever", "reckitt", "procter", "p g", "coca cola", "ambev", "brf", "jbs", "hypera", "kimberly", "kimberly clark", "sc johnson", "colgate palmolive", "m dias branco"].includes(marcaNorm)) {
    return marcaNorm;
  }
  // Tenta identificar sub-marca consagrada dentro do nome do produto
  for (const sub of SUBMARCAS_CONHECIMENTOS) {
    if (padNome.includes(` ${sub} `)) return sub;
  }
  return marcaNorm || "";
}

function extrairAssetHash(urlImg) {
  if (!urlImg || typeof urlImg !== "string") return null;
  const m = urlImg.match(/([0-9a-f]{5,10}-[0-9a-f]{6,16}|[0-9a-f]{20,40})\.(webp|png|jpg|jpeg)/i);
  return m ? m[1].toLowerCase() : null;
}

function extrairGramatura(nome) {
  if (!nome) return null;
  const n = normalizarTexto(nome)
    .replace(/\bleve\s*(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml)\s*pague\s*\d+(?:[.,]\d+)?\s*(?:kg|kilos|g|gr|gramas|l|lt|litros|litro|ml)?\b/gi, "$1$2")
    .replace(/\bleve\s*(\d+)\s*pague\s*\d+\b/gi, "$1un");

  // 1. Multipack explícito: ex "6x350ml", "12 x 269ml", "3 unidades de 70g", "c/ 3 de 90g"
  const mPack = n.match(/\b(\d+)\s*(?:x|un\s*de|unid\s*de|unidades\s*de)\s*(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml)\b/i);
  if (mPack) {
    const qtd = parseFloat(mPack[1]);
    const val = parseFloat(mPack[2].replace(",", "."));
    const un = mPack[3].toLowerCase();
    const totalBase = (un.startsWith("k") || un.startsWith("l")) ? val * 1000 : val;
    return {
      valorNorm: Math.round(qtd * totalBase),
      unidade: (un.startsWith("l") || un === "ml") ? "ml" : "g",
      packQtd: qtd,
      str: `${qtd}x${val}${un}`
    };
  }

  // 2. Peso ou Volume (PRIORIDADE MÁXIMA sobre contagem de unidades/metros)
  const todosPesosVol = [...n.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml)\b/gi)];
  if (todosPesosVol.length > 0) {
    const m = todosPesosVol[todosPesosVol.length - 1];
    const val = parseFloat(m[1].replace(",", "."));
    const un = m[2].toLowerCase();
    const valorNorm = (un.startsWith("k") || un.startsWith("l")) ? Math.round(val * 1000) : Math.round(val);
    const unidade = (un.startsWith("l") || un === "ml") ? "ml" : "g";
    // Verifica se há também contagem de pack ("com 3 unidades", "pack 3 un")
    const mQtdAux = n.match(/\b(\d+)\s*(un|unid|unidades|rolos|rolo|capsulas|caps)\b/i);
    const packQtd = mQtdAux ? parseInt(mQtdAux[1], 10) : 1;
    return {
      valorNorm,
      unidade,
      packQtd: (packQtd > 1 && packQtd <= 100) ? packQtd : 1,
      str: `${val}${un}`
    };
  }

  // 3. Contagem de Rolos / Ovos / Fraldas / Unidades (quando não há g/ml)
  const mRolosOvos = n.match(/\b(\d+)\s*(rolos|rolo|ovos|capsulas|caps|fraldas|tiras|absorventes)\b/i);
  if (mRolosOvos) {
    const val = parseInt(mRolosOvos[1], 10);
    if (val >= 1 && val <= 500) {
      return { valorNorm: val, unidade: "unid", packQtd: val, str: `${val}un` };
    }
  }

  const mUn = n.match(/\b(\d+)\s*(un|unid|unidades|folhas)\b/i);
  if (mUn) {
    const val = parseInt(mUn[1], 10);
    if (val > 1 && val <= 500) {
      return { valorNorm: val, unidade: "unid", packQtd: val, str: `${val}un` };
    }
  }

  const mMetros = n.match(/\b(\d+(?:[.,]\d+)?)\s*(metros|metro|m)\b/i);
  if (mMetros) {
    const val = Math.round(parseFloat(mMetros[1].replace(",", ".")));
    if (val >= 1 && val <= 500) {
      return { valorNorm: val, unidade: "m", packQtd: 1, str: `${val}m` };
    }
  }

  return null;
}

function temConflitoVariante(nomeK, nomeF) {
  const nk = ` ${normalizarTextoVinculo(nomeK)} `;
  const nf = ` ${normalizarTextoVinculo(nomeF)} `;

  const zeroK = /\b(zero|diet|light)\b/.test(nk);
  const zeroF = /\b(zero|diet|light)\b/.test(nf);
  if (zeroK !== zeroF) return true;

  const lacK = /\bzerolactose\b/.test(nk);
  const lacF = /\bzerolactose\b/.test(nf);
  if (lacK !== lacF) return true;

  const alcK = /\bzeroalcool\b/.test(nk);
  const alcF = /\bzeroalcool\b/.test(nf);
  if (alcK !== alcF) return true;

  const gasK = /\bcomgas\b/.test(nk) ? 1 : (/\bsemgas\b/.test(nk) ? -1 : 0);
  const gasF = /\bcomgas\b/.test(nf) ? 1 : (/\bsemgas\b/.test(nf) ? -1 : 0);
  if (gasK !== 0 && gasF !== 0 && gasK !== gasF) return true;

  const salK = /\bcomsal\b/.test(nk) ? 1 : (/\bsemsal\b/.test(nk) ? -1 : 0);
  const salF = /\bcomsal\b/.test(nf) ? 1 : (/\bsemsal\b/.test(nf) ? -1 : 0);
  if (salK !== 0 && salF !== 0 && salK !== salF) return true;

  for (const grupo of GRUPOS_CONFLITO_SABOR) {
    const achadosK = [];
    const achadosF = [];
    for (const termo of grupo) {
      const t = termo.trim();
      if (nk.includes(` ${t} `)) achadosK.push(t);
      if (nf.includes(` ${t} `)) achadosF.push(t);
    }
    if (achadosK.length > 0 && achadosF.length > 0) {
      const comum = achadosK.some((t) => achadosF.includes(t));
      if (!comum) return true;
    }
  }
  return false;
}

function extrairTokensNucleo(nome, marcaNorm, marcaCanon = "") {
  const texto = normalizarTextoVinculo(nome)
    .replace(/\b\d+(?:[.,]\d+)?\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml|un|unid|unidades|rolos|rolo|folhas|metros|metro|m|cm|mm)\b/gi, " ");
  const marcaTokens = new Set(
    `${marcaNorm || ""} ${marcaCanon || ""}`
      .split(/\s+/)
      .filter((w) => w.length >= 2)
  );
  const tokens = [];
  for (const w of texto.split(/\s+/)) {
    if (w.length < 2) continue;
    if (STOPWORDS.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    if (marcaTokens.has(w)) continue;
    tokens.push(w);
  }
  return Array.from(new Set(tokens));
}

function tiposBaseCompativeis(listK, listF) {
  if (!listK.length || !listF.length) return false;
  // Se compartilham qualquer um dos 2 primeiros tokens principais
  const headK = listK.slice(0, 2);
  const headF = listF.slice(0, 2);
  for (const tk of headK) {
    for (const tf of headF) {
      if (tk === tf) return true;
      if (tk.length >= 4 && tf.length >= 4 && (tk.startsWith(tf) || tf.startsWith(tk))) return true;
    }
  }
  // Verifica se pertencem ao mesmo grupo de tipo equivalente de produto
  for (const grp of GRUPOS_TIPO_EQUIVALENTE) {
    const kIn = headK.some((t) => grp.has(t));
    const fIn = headF.some((t) => grp.has(t));
    if (kIn && fIn) return true;
  }
  return false;
}

function marcasSaoExatas(prodK, prodF) {
  let mK = prodK._marcaVinc !== undefined ? prodK._marcaVinc : normalizarMarcaVinculo(prodK.marca);
  let mF = prodF._marcaVinc !== undefined ? prodF._marcaVinc : normalizarMarcaVinculo(prodF.marca);
  const nK = prodK._nomeVinc !== undefined ? prodK._nomeVinc : normalizarTextoVinculo(prodK.nome);
  const nF = prodF._nomeVinc !== undefined ? prodF._nomeVinc : normalizarTextoVinculo(prodF.nome);
  const cK = prodK._marcaCanon !== undefined ? prodK._marcaCanon : resolverMarcaCanonica(mK, nK);
  const cF = prodF._marcaCanon !== undefined ? prodF._marcaCanon : resolverMarcaCanonica(mF, nF);

  if (mK && mF && mK === mF) return { exata: true, marcaResolvida: mK };
  if (cK && cF && cK === cF) return { exata: true, marcaResolvida: cK };

  const padNK = ` ${nK} `;
  const padNF = ` ${nF} `;

  // Se uma das marcas veio de conglomerado ou genérica, mas a marca exata do outro consta como palavra inteira nos dois
  if (cK && cK.length >= 3 && padNF.includes(` ${cK} `) && (!mF || cF === cK || mF.includes(cK) || cK.includes(mF) || ["nestle", "mondelez", "pepsico", "unilever", "reckitt", "procter", "coca cola", "ambev", "brf", "jbs", "kimberly"].includes(mF))) {
    return { exata: true, marcaResolvida: cK };
  }
  if (cF && cF.length >= 3 && padNK.includes(` ${cF} `) && (!mK || cK === cF || mK.includes(cF) || cF.includes(mK) || ["nestle", "mondelez", "pepsico", "unilever", "reckitt", "procter", "coca cola", "ambev", "brf", "jbs", "kimberly"].includes(mK))) {
    return { exata: true, marcaResolvida: cF };
  }

  // Hortifruti / Açougue a granel sem marca de fabricante
  if (!mK && !mF && !cK && !cF) {
    return { exata: true, marcaResolvida: "", granel: true };
  }

  return { exata: false, marcaResolvida: "" };
}

function calcularScoreCasamento(prodK, prodF) {
  let score = 0;
  const motivos = [];

  if (temConflitoVariante(prodK.nome, prodF.nome)) {
    return { score: 0, motivo: "Variante/sabor conflitante" };
  }

  // 1. Gramas / Litros / Medida: 100% EXATA OBRIGATÓRIA
  const gramK = prodK._gramCache !== undefined ? prodK._gramCache : extrairGramatura(prodK.nome);
  const gramF = prodF._gramCache !== undefined ? prodF._gramCache : extrairGramatura(prodF.nome);

  if (gramK && gramF) {
    if (gramK.unidade !== gramF.unidade || gramK.valorNorm !== gramF.valorNorm) {
      return { score: 0, motivo: `Gramatura/litragem diferente (${gramK.str} vs ${gramF.str})` };
    }
    if (gramK.packQtd && gramF.packQtd && gramK.packQtd !== gramF.packQtd && (gramK.packQtd > 1 || gramF.packQtd > 1)) {
      return { score: 0, motivo: `Quantidade no pack diferente (${gramK.packQtd}un vs ${gramF.packQtd}un)` };
    }
    score += 35;
    motivos.push(`Medida 100% (${gramK.str})`);
  } else if (!gramK && !gramF) {
    const unK = String(prodK.unidade || "UN").toUpperCase();
    const unF = String(prodF.unidade || "UN").toUpperCase();
    if (unK !== unF) {
      return { score: 0, motivo: "Unidades de venda incompatíveis (KG vs UN)" };
    }
    score += unK === "KG" ? 28 : 18;
  } else {
    return { score: 0, motivo: "Medida ausente em um dos produtos (exige 100% igual)" };
  }

  // 2. Hash da Imagem no Catálogo OSuper
  const hashK = prodK._hashCache !== undefined ? prodK._hashCache : extrairAssetHash(prodK.imagem);
  const hashF = prodF._hashCache !== undefined ? prodF._hashCache : extrairAssetHash(prodF.imagem);
  const mesmaFoto = Boolean(hashK && hashF && hashK === hashF);
  if (mesmaFoto) {
    score += 25;
    motivos.push("Foto idêntica");
  }

  // 3. Marca: 100% EXATA OBRIGATÓRIA
  const checkMarca = marcasSaoExatas(prodK, prodF);
  if (!checkMarca.exata) {
    return { score: 0, motivo: "Marcas diferentes" };
  }
  if (checkMarca.granel) {
    score += 12;
  } else {
    score += 30;
    motivos.push(`Marca 100% (${checkMarca.marcaResolvida.toUpperCase()})`);
  }

  // 4. Tokens de Produto: Nome o mais parecido possível
  const listK = prodK._tokensVinc !== undefined ? prodK._tokensVinc : extrairTokensNucleo(prodK.nome, prodK._marcaVinc, checkMarca.marcaResolvida);
  const listF = prodF._tokensVinc !== undefined ? prodF._tokensVinc : extrairTokensNucleo(prodF.nome, prodF._marcaVinc, checkMarca.marcaResolvida);
  const tokensK = new Set(listK);
  const tokensF = new Set(listF);

  if (tokensK.size === 0 || tokensF.size === 0) {
    return { score: 0, motivo: "Sem termos de produto identificáveis" };
  }

  let intersecao = 0;
  for (const tk of tokensK) {
    if (tokensF.has(tk)) {
      intersecao++;
    } else if (tk.length >= 4) {
      for (const tf of tokensF) {
        if (tf.length >= 4 && (tk.startsWith(tf) || tf.startsWith(tk))) {
          intersecao += 0.85;
          break;
        }
      }
    }
  }

  const uniao = new Set([...tokensK, ...tokensF]).size;
  const jaccard = uniao > 0 ? intersecao / uniao : 0;
  const minLen = Math.min(tokensK.size, tokensF.size);
  const containment = minLen > 0 ? intersecao / minLen : 0;
  const dice = (tokensK.size + tokensF.size) > 0 ? (2 * intersecao) / (tokensK.size + tokensF.size) : 0;
  const combinado = (dice * 0.45) + (containment * 0.35) + (jaccard * 0.20);

  if (!tiposBaseCompativeis(listK, listF) && !mesmaFoto && containment < 0.75) {
    return { score: 0, motivo: "Tipo de produto diferente" };
  }

  // Para produtos sem marca (granel/hortifruti/açougue), exige similaridade de nome altíssima (>= 0.75)
  const limiarSim = checkMarca.granel ? 0.75 : 0.42;
  if (combinado < limiarSim && !mesmaFoto) {
    return { score: 0, motivo: "Baixa similaridade de nome" };
  }

  const ptsTokens = Math.round(combinado * 35);
  score += ptsTokens;
  motivos.push(`Similaridade (${Math.round(combinado * 100)}%)`);

  // 5. Coerência de Preço (impede vincular fardo/caixa fechada com unidade avulsa)
  const pK = Number(prodK.preco || 0);
  const pF = Number(prodF.preco || 0);
  if (pK > 0 && pF > 0) {
    const razao = Math.max(pK, pF) / Math.min(pK, pF);
    if (razao > 2.35 && !mesmaFoto) {
      return { score: 0, motivo: "Discrepância extrema de preço (fardo vs unidade)" };
    }
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    motivo: motivos.join(" + ") || "Vínculo 100% compatível"
  };
}

function prepararCacheVinculoLista(lista) {
  const porMarcaMedida = new Map();
  const porMedidaToken = new Map();
  const porAsset = new Map();

  for (const p of lista) {
    if (!p || !p.id) continue;
    p._gramCache = extrairGramatura(p.nome);
    p._hashCache = extrairAssetHash(p.imagem);
    p._nomeVinc = normalizarTextoVinculo(p.nome);
    p._marcaVinc = normalizarMarcaVinculo(p.marca);
    p._marcaCanon = resolverMarcaCanonica(p._marcaVinc, p._nomeVinc);
    p._tokensVinc = extrairTokensNucleo(p.nome, p._marcaVinc, p._marcaCanon);
    p._medidaChave = p._gramCache
      ? `${p._gramCache.unidade}_${p._gramCache.valorNorm}`
      : `UN_${String(p.unidade || "UN").toUpperCase()}`;

    if (p._hashCache) {
      if (!porAsset.has(p._hashCache)) porAsset.set(p._hashCache, []);
      porAsset.get(p._hashCache).push(p);
    }

    const marcasIndexar = new Set([p._marcaVinc, p._marcaCanon].filter((m) => m && m.length >= 2));
    for (const m of marcasIndexar) {
      const kMM = `${m}__${p._medidaChave}`;
      if (!porMarcaMedida.has(kMM)) porMarcaMedida.set(kMM, []);
      porMarcaMedida.get(kMM).push(p);
    }

    for (let i = 0; i < Math.min(3, p._tokensVinc.length); i++) {
      const kMT = `${p._medidaChave}__${p._tokensVinc[i]}`;
      if (!porMedidaToken.has(kMT)) porMedidaToken.set(kMT, []);
      porMedidaToken.get(kMT).push(p);
    }
  }

  return { porMarcaMedida, porMedidaToken, porAsset };
}

function obterCandidatosIndexados(prodOrigem, indiceDestino) {
  const cands = new Set();
  if (prodOrigem._hashCache && indiceDestino.porAsset.has(prodOrigem._hashCache)) {
    for (const d of indiceDestino.porAsset.get(prodOrigem._hashCache)) cands.add(d);
  }
  const marcas = new Set([prodOrigem._marcaVinc, prodOrigem._marcaCanon].filter((m) => m && m.length >= 2));
  for (const m of marcas) {
    const kMM = `${m}__${prodOrigem._medidaChave}`;
    const arr = indiceDestino.porMarcaMedida.get(kMM);
    if (arr) for (const d of arr) cands.add(d);
  }
  if (cands.size < 15) {
    for (let i = 0; i < Math.min(3, prodOrigem._tokensVinc.length); i++) {
      const kMT = `${prodOrigem._medidaChave}__${prodOrigem._tokensVinc[i]}`;
      const arr = indiceDestino.porMedidaToken.get(kMT);
      if (arr && arr.length <= 180) for (const d of arr) cands.add(d);
    }
  }
  return cands;
}

export async function executarVinculacaoInteligente(firebaseBase = FIREBASE_BASE) {
  console.log("🔗 Iniciando vinculação inteligente tripla (Koch × Fort × Angeloni) com Medida e Marca 100% Exatas...");

  let respKoch = null;
  let respFort = null;
  let respAng = null;
  let respVinc = null;

  try {
    [respKoch, respFort, respAng, respVinc] = await Promise.all([
      fetch(authUrl(`${firebaseBase}/koch_loja_1408.json`)).catch(() => null),
      fetch(authUrl(`${firebaseBase}/fort_loja_1644.json`)).catch(() => null),
      fetch(authUrl(`${firebaseBase}/angeloni_loja_28.json`)).catch(() => null),
      fetch(authUrl(`${firebaseBase}/vinculos_produtos.json`)).catch(() => null)
    ]);
  } catch (err) {
    console.log(`⚠️ Erro de conexão ao buscar catálogos para vincular: ${err.message}`);
    return null;
  }

  if (!respKoch || !respKoch.ok || !respFort || !respFort.ok) {
    console.log("⚠️ Um dos catálogos principais ainda não está disponível no Firebase para vincular.");
    return null;
  }

  const dadosKoch = await respKoch.json();
  const dadosFort = await respFort.json();
  const dadosAng = respAng && respAng.ok ? await respAng.json().catch(() => null) : null;
  const dadosVinc = respVinc && respVinc.ok ? await respVinc.json().catch(() => null) : null;

  const prodsKoch = Array.isArray(dadosKoch?.produtos) ? dadosKoch.produtos : [];
  const prodsFort = Array.isArray(dadosFort?.produtos) ? dadosFort.produtos : [];
  const prodsAngeloni = Array.isArray(dadosAng?.produtos) ? dadosAng.produtos : [];

  if (prodsKoch.length === 0 || prodsFort.length === 0) {
    console.log("⚠️ Catálogos insuficientes para cruzamento.");
    return null;
  }

  console.log(`📊 Cruzando ${prodsKoch.length} itens do Koch × ${prodsFort.length} do Fort × ${prodsAngeloni.length} do Angeloni Porto Belo...`);

  const manuaisExistentes = { ...(dadosVinc?.manuais || {}) };
  const rejeitadosExistentes = { ...(dadosVinc?.rejeitados || {}) };
  const configVinculos = dadosVinc?.configVinculos || {
    scoreMinimo: 65,
    tolGramaturaPct: 0,
    maxRatioPreco: 2.35,
    exigirMarcaOuFoto: true,
    autoVincularAoSincronizar: true
  };
  const scoreMinimoAceito = Math.max(60, Math.min(92, Number(configVinculos.scoreMinimo || 65)));

  if (dadosVinc && typeof dadosVinc === "object") {
    if (Array.isArray(dadosVinc.vinculos)) {
      for (const v of dadosVinc.vinculos) {
        if (v && v.idKoch && v.idFort && v.manual) {
          manuaisExistentes[String(v.idKoch)] = String(v.idFort);
        }
      }
    }
    for (const [ch, v] of Object.entries(dadosVinc)) {
      if (ch.startsWith("vinc_") && v && v.idKoch && v.idFort && v.manual) {
        manuaisExistentes[String(v.idKoch)] = String(v.idFort);
      }
    }
  }

  // Indexação ultrarrápida em O(N) por (Marca Canônica + Medida Exata) e (Medida Exata + Token Principal)
  const idxKoch = prepararCacheVinculoLista(prodsKoch);
  const idxFort = prepararCacheVinculoLista(prodsFort);
  const idxAng = prepararCacheVinculoLista(prodsAngeloni);

  // 1. Pareamento Koch ⇄ Fort
  const mapaKochParaFort = {};
  const mapaFortParaKoch = {};
  const fortUsadosKF = new Set();
  const paresKF = [];

  for (const [idK, idF] of Object.entries(manuaisExistentes)) {
    const sK = String(idK);
    const sF = String(idF);
    if (!rejeitadosExistentes[`${sK}__${sF}`]) {
      mapaKochParaFort[sK] = sF;
      mapaFortParaKoch[sF] = sK;
      fortUsadosKF.add(sF);
    }
  }

  for (const k of prodsKoch) {
    if (!k || !k.id) continue;
    const idK = String(k.id);
    if (mapaKochParaFort[idK]) continue;

    for (const f of obterCandidatosIndexados(k, idxFort)) {
      const idF = String(f.id);
      if (fortUsadosKF.has(idF)) continue;
      if (rejeitadosExistentes[`${idK}__${idF}`]) continue;

      const res = calcularScoreCasamento(k, f);
      if (res.score >= scoreMinimoAceito) {
        paresKF.push({ idK, idF, score: res.score, motivo: res.motivo });
      }
    }
  }

  paresKF.sort((a, b) => b.score - a.score);
  const metaKF = {};
  for (const p of paresKF) {
    if (mapaKochParaFort[p.idK] || fortUsadosKF.has(p.idF)) continue;
    mapaKochParaFort[p.idK] = p.idF;
    mapaFortParaKoch[p.idF] = p.idK;
    fortUsadosKF.add(p.idF);
    metaKF[`${p.idK}__${p.idF}`] = { score: p.score, motivo: p.motivo };
  }

  // 2. Pareamento Koch ⇄ Angeloni e Fort ⇄ Angeloni
  const mapaKochParaAngeloni = {};
  const mapaAngeloniParaKoch = {};
  const mapaFortParaAngeloni = {};
  const mapaAngeloniParaFort = {};
  const metaKA = {};
  const metaFA = {};

  if (prodsAngeloni.length > 0) {
    const paresKA = [];
    for (const k of prodsKoch) {
      if (!k || !k.id) continue;
      const idK = String(k.id);
      for (const a of obterCandidatosIndexados(k, idxAng)) {
        const idA = String(a.id);
        const res = calcularScoreCasamento(k, a);
        if (res.score >= scoreMinimoAceito) {
          paresKA.push({ idK, idA, score: res.score, motivo: res.motivo });
        }
      }
    }
    paresKA.sort((x, y) => y.score - x.score);
    const angUsadosK = new Set();
    for (const p of paresKA) {
      if (mapaKochParaAngeloni[p.idK] || angUsadosK.has(p.idA)) continue;
      mapaKochParaAngeloni[p.idK] = p.idA;
      mapaAngeloniParaKoch[p.idA] = p.idK;
      angUsadosK.add(p.idA);
      metaKA[`${p.idK}__${p.idA}`] = { score: p.score, motivo: p.motivo };
    }

    const paresFA = [];
    for (const f of prodsFort) {
      if (!f || !f.id) continue;
      const idF = String(f.id);
      for (const a of obterCandidatosIndexados(f, idxAng)) {
        const idA = String(a.id);
        const res = calcularScoreCasamento(f, a);
        if (res.score >= scoreMinimoAceito) {
          paresFA.push({ idF, idA, score: res.score, motivo: res.motivo });
        }
      }
    }
    paresFA.sort((x, y) => y.score - x.score);
    const angUsadosF = new Set();
    for (const p of paresFA) {
      if (mapaFortParaAngeloni[p.idF] || angUsadosF.has(p.idA)) continue;
      mapaFortParaAngeloni[p.idF] = p.idA;
      mapaAngeloniParaFort[p.idA] = p.idF;
      angUsadosF.add(p.idA);
      metaFA[`${p.idF}__${p.idA}`] = { score: p.score, motivo: p.motivo };
    }
  }

  // 3. Consolidação Tripla Unificada (3 Lojas: K+F+A, e 2 Lojas: K+F, K+A, F+A)
  const vinculosFinais = [];
  const mapaFlatVinculos = {};
  const kConsolidados = new Set();
  const fConsolidados = new Set();
  const aConsolidados = new Set();
  const agoraIso = new Date().toISOString();

  // 3A. Vínculos que possuem Koch + Fort (e opcionalmente Angeloni = 3 lojas!)
  for (const [idK, idF] of Object.entries(mapaKochParaFort)) {
    const idA = mapaKochParaAngeloni[idK] || mapaFortParaAngeloni[idF] || null;
    const idAFinal = (idA && !aConsolidados.has(idA)) ? idA : null;
    kConsolidados.add(idK);
    fConsolidados.add(idF);
    if (idAFinal) aConsolidados.add(idAFinal);

    const ehManual = Boolean(manuaisExistentes[idK] === idF);
    const info = metaKF[`${idK}__${idF}`] || { score: 100, motivo: "Vínculo Manual Confirmado" };
    const item = {
      idKoch: idK,
      idFort: idF,
      ...(idAFinal ? { idAngeloni: idAFinal } : {}),
      score: ehManual ? 100 : info.score,
      motivo: ehManual ? "Vínculo Manual Confirmado" : info.motivo,
      manual: ehManual,
      data: agoraIso
    };
    const ch = `vinc_${idK}_${idF}`;
    vinculosFinais.push(item);
    mapaFlatVinculos[ch] = item;
  }

  // 3B. Vínculos Koch + Angeloni (onde o produto não tinha no Fort, ou seja, 2 lojas: Koch × Angeloni)
  for (const [idK, idA] of Object.entries(mapaKochParaAngeloni)) {
    if (kConsolidados.has(idK) || aConsolidados.has(idA)) continue;
    // Se esse Angeloni também casou com algum Fort solto, forma grupo de 3 lojas!
    const idF = mapaAngeloniParaFort[idA];
    const idFFinal = (idF && !fConsolidados.has(idF) && !rejeitadosExistentes[`${idK}__${idF}`]) ? idF : null;

    kConsolidados.add(idK);
    aConsolidados.add(idA);
    if (idFFinal) {
      fConsolidados.add(idFFinal);
      mapaKochParaFort[idK] = idFFinal;
      mapaFortParaKoch[idFFinal] = idK;
    }

    const info = metaKA[`${idK}__${idA}`] || { score: 90, motivo: "Vínculo Exato Koch × Angeloni" };
    const ch = idFFinal ? `vinc_${idK}_${idFFinal}` : `vinc_k${idK}_a${idA}`;
    const item = {
      idKoch: idK,
      idFort: idFFinal || null,
      idAngeloni: idA,
      score: info.score,
      motivo: info.motivo,
      manual: false,
      data: agoraIso
    };
    vinculosFinais.push(item);
    mapaFlatVinculos[ch] = item;
  }

  // 3C. Vínculos Fort + Angeloni (onde o produto não tinha no Koch, ou seja, 2 lojas: Fort × Angeloni)
  for (const [idF, idA] of Object.entries(mapaFortParaAngeloni)) {
    if (fConsolidados.has(idF) || aConsolidados.has(idA)) continue;
    fConsolidados.add(idF);
    aConsolidados.add(idA);

    const info = metaFA[`${idF}__${idA}`] || { score: 90, motivo: "Vínculo Exato Fort × Angeloni" };
    const ch = `vinc_f${idF}_a${idA}`;
    const item = {
      idKoch: null,
      idFort: idF,
      idAngeloni: idA,
      score: info.score,
      motivo: info.motivo,
      manual: false,
      data: agoraIso
    };
    vinculosFinais.push(item);
    mapaFlatVinculos[ch] = item;
  }

  const totalTriplos = vinculosFinais.filter((v) => v.idKoch && v.idFort && v.idAngeloni).length;
  console.log(`🔗 Resultado da Vinculação Tripla: ${vinculosFinais.length} grupos comparativos totais (${totalTriplos} nas 3 lojas | ${Object.keys(mapaKochParaFort).length} K×F | ${Object.keys(mapaKochParaAngeloni).length} K×A | ${Object.keys(mapaFortParaAngeloni).length} F×A).`);

  const payload = {
    ...mapaFlatVinculos,
    atualizadoEm: agoraIso,
    totalVinculos: vinculosFinais.length,
    totalVinculosTriplos: totalTriplos,
    totalVinculosKochFort: Object.keys(mapaKochParaFort).length,
    totalVinculosKochAngeloni: Object.keys(mapaKochParaAngeloni).length,
    totalVinculosFortAngeloni: Object.keys(mapaFortParaAngeloni).length,
    vinculos: vinculosFinais,
    mapaKochParaFort,
    mapaFortParaKoch,
    mapaKochParaAngeloni,
    mapaAngeloniParaKoch,
    mapaFortParaAngeloni,
    mapaAngeloniParaFort,
    manuais: manuaisExistentes,
    rejeitados: rejeitadosExistentes,
    configVinculos
  };

  const bodyStr = JSON.stringify(payload);
  let salvouOk = false;
  for (let tent = 1; tent <= 3; tent++) {
    try {
      const rPut = await fetch(authUrl(FIREBASE_VINCULOS_ENDPOINT), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Connection": "close"
        },
        body: bodyStr,
        signal: AbortSignal.timeout(45000)
      });
      if (rPut.ok) {
        salvouOk = true;
        console.log(`✅ Sucesso! ${vinculosFinais.length} vínculos de produtos salvos no Firebase (${FIREBASE_VINCULOS_ENDPOINT}).`);
        break;
      } else {
        console.log(`⚠️ Tentativa ${tent}/3 ao salvar vínculos retornou HTTP ${rPut.status}`);
      }
    } catch (err) {
      console.log(`⚠️ Tentativa ${tent}/3 falhou ao salvar vínculos no Firebase: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000 * tent));
    }
  }
  if (!salvouOk) {
    console.log("❌ Erro definitivo ao salvar vínculos no Firebase após 3 tentativas.");
  }

  return payload;
}

// =========================================================================
// PONTO DE ENTRADA
// =========================================================================
let salvandoCancelamento = false;
const tratarCancelamento = async (sinal) => {
  if (salvandoCancelamento) return;
  salvandoCancelamento = true;
  registrarLog("AVISO", "Sistema", `Sinal de encerramento (${sinal}). Salvando tudo no Firebase antes de sair...`);
  try {
    sessao.status = "CANCELADO_SALVO";
    sessao.mensagem = `⏹ Encerrado (${sinal}) em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Tudo salvo com segurança!`;
    await enviarTelemetriaAoVivo(true);
    if (SOU_MAESTRO) {
      await salvarCursor24hRemoto(sessao.rotaIndiceAtual, sessao.offsetAtual, false, sessao.paginaAtual);
      await gravarComSegurancaNoFirebase(`Salvamento por Cancelamento (${sinal})`);
      await enviarTelemetriaAoVivo(true);
    }
  } catch (e) {}
  process.exit(0);
};

process.on("SIGINT", () => tratarCancelamento("SIGINT"));
process.on("SIGTERM", () => tratarCancelamento("SIGTERM"));

if (process.argv.includes("--vincular")) {
  executarVinculacaoInteligente().then(() => process.exit(0)).catch((err) => {
    console.error("Erro na vinculação:", err);
    process.exit(1);
  });
} else {
  executarRoboCloud().catch(async (err) => {
    registrarLog("ERRO", "Fatal", `Exceção: ${err.message}`);
    sessao.status = "ERRO";
    sessao.mensagem = `❌ Erro em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}): ${err.message}. Progresso salvo!`;
    await gravarComSegurancaNoFirebase("Salvamento de Emergência").catch(() => {});
    await enviarTelemetriaAoVivo(true).catch(() => {});
    process.exit(1);
  });
}
