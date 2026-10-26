import { chromium } from "playwright";
import fs from "node:fs";
import { ROTAS_PADRAO_KOCH, ROTAS_PADRAO_FORT, ROTAS_RADAR_KOCH, ROTAS_RADAR_FORT, obterRotasPorCamada } from "./rotas-mercados.mjs";

// =========================================================================
// CONFIGURAÇÃO MULTI-MERCADO: SUPERKOCH (LOJA 1408) & FORT ATACADISTA (LOJA 1644)
// =========================================================================
const MERCADO_ALVO = (process.env.MERCADO || (process.argv.includes("--fort") ? "fort" : "koch")).toLowerCase();
const EH_FORT = MERCADO_ALVO === "fort";
const MERCADO_NOME = EH_FORT ? "Fort Atacadista (Porto Belo 1644)" : "SuperKoch (Itapema 1408)";
const CONTA_ID = EH_FORT ? "334" : "295";
const LOJA_ID = EH_FORT ? "1644" : "1408";
const SITE_URL = EH_FORT ? "https://www.fortatacadista.com.br" : "https://www.superkoch.com.br";
const COOKIE_LOJA_NOME = `st_${CONTA_ID}`;
const COOKIE_LOJA_VALOR = `%7B%22id%22%3A%22${LOJA_ID}%22%2C%22userSelected%22%3Atrue%7D`;
const COOKIE_LOJA_DOMINIO = EH_FORT ? ".fortatacadista.com.br" : ".superkoch.com.br";
const DEFAULT_STORE_PATH = EH_FORT ? "/334/1644/v2/search" : "/295/1408/v2/search";
const HEADER_TOKEN_NAME = EH_FORT ? "x-osuper-search-token" : "x-osuper-identity-token";

const FIREBASE_BASE = (process.env.FIREBASE_URL || "https://mercaro-e6035-default-rtdb.firebaseio.com").replace(/\/$/, "");
const FIREBASE_SECRET = (process.env.FIREBASE_SECRET || process.env.FIREBASE_AUTH || "").trim();

function authUrl(url) {
  if (!FIREBASE_SECRET) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}auth=${encodeURIComponent(FIREBASE_SECRET)}`;
}

const FIREBASE_ENDPOINT = EH_FORT ? `${FIREBASE_BASE}/fort_loja_1644.json` : `${FIREBASE_BASE}/koch_loja_1408.json`;
const FIREBASE_TELEMETRIA_ENDPOINT = EH_FORT ? `${FIREBASE_BASE}/robo_controle/telemetria_fort.json` : `${FIREBASE_BASE}/robo_controle/telemetria_koch.json`;
const FIREBASE_COMANDOS_ENDPOINT = EH_FORT ? `${FIREBASE_BASE}/robo_controle/comandos_fort.json` : `${FIREBASE_BASE}/robo_controle/comandos.json`;
const FIREBASE_FILA_ENDPOINT = EH_FORT ? `${FIREBASE_BASE}/robo_controle/fila_custom_fort.json` : `${FIREBASE_BASE}/robo_controle/fila_custom.json`;
const FIREBASE_ENXAME_BASE = EH_FORT ? `${FIREBASE_BASE}/robo_controle/enxame_fort` : `${FIREBASE_BASE}/robo_controle/enxame_koch`;
const FIREBASE_VINCULOS_ENDPOINT = `${FIREBASE_BASE}/vinculos_produtos.json`;

// Identificação desta Máquina no Enxame (1 a 10 Máquinas com IPs diferentes)
const WORKER_ID = Math.max(1, Number(process.env.WORKER_ID) || 1);
const TOTAL_WORKERS = Math.max(1, Math.min(10, Number(process.env.TOTAL_WORKERS) || 1));
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

// Leitura da Camada de Execução (1 = RADAR, 2 = TURNO 2A, 3 = COMPLETA NOTURNA)
const argCamada = process.argv.find((a) => a.startsWith("--camada=") || a.startsWith("--modo="))?.split("=")[1];
const MODO_CAMADA_BRUTO = String(argCamada || process.env.MODO_CAMADA || process.env.MODO_FILA || "2A").toUpperCase();
const EH_MODO_RADAR = MODO_CAMADA_BRUTO === "RADAR" || MODO_CAMADA_BRUTO === "1" || MODO_CAMADA_BRUTO === "1A" || MODO_CAMADA_BRUTO === "OFERTAS";

// Configurações Furtivas, Jitter e Otimizações de Rede
const BATCH_SIZE_RAW = Number(process.env.BATCH_SIZE) || (EH_MODO_RADAR ? (EH_FORT ? 20 : 36) : 12);
// Fort Atacadista OSuper tem limite rígido de size <= 20 ("size must not exceed 20")
const MAX_ALLOWED_SIZE = EH_FORT ? 20 : 60;
const CONFIG = {
  delayMs: Math.max(600, Number(process.env.DELAY_MS) || (EH_MODO_RADAR ? 1500 : 2200)),
  delayTrocaRotaMs: Math.max(1200, Number(process.env.DELAY_ROTA_MS) || (EH_MODO_RADAR ? 2400 : 3800)),
  esperaErroRedeMs: 5 * 60 * 1000, // 5 minutos de espera em caso de bloqueio ou queda de rede
  backoffCurtoMs: 15000,
  size: Math.max(12, Math.min(MAX_ALLOWED_SIZE, BATCH_SIZE_RAW)),
  modoFila: MODO_CAMADA_BRUTO,
  usarProxy: false,
  listaProxies: [],
  salvarAoAdicionar: Math.max(1, Number(process.env.SALVAR_AO_ADICIONAR) || (EH_MODO_RADAR ? 5 : 1)),
  salvarAoAtualizar: Math.max(1, Number(process.env.SALVAR_AO_ATUALIZAR) || (EH_MODO_RADAR ? 10 : 50)),
  cooldownSaveMs: Math.max(10000, Number(process.env.COOLDOWN_SAVE_MS) || (EH_MODO_RADAR ? 15000 : 25000)),
  autoSaveEveryDepto: true,
  startIndex: Math.max(0, (Number(process.env.START_INDEX) || 1) - 1),
  dryRun: String(process.env.DRY_RUN || "false").toLowerCase() === "true"
};

const ROTAS_PADRAO_SEQUENCIAIS = EH_FORT ? ROTAS_PADRAO_FORT : ROTAS_PADRAO_KOCH;

// =========================================================================
// SELETOR DINÂMICO DE FILAS POR CAMADA (1 = RADAR, 2 = TURNO 2A, 3 = COMPLETA)
// =========================================================================
function obterRotasFiltradasPorModo(modo, filaCustom = null) {
  return obterRotasPorCamada(MERCADO_ALVO, modo, filaCustom);
}

let ROTAS_ATIVAS = obterRotasFiltradasPorModo(CONFIG.modoFila);

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
    : `${MERCADO_NOME} (Nuvem V10 • Modo ${CONFIG.modoFila})`,
  iniciadoEm: new Date().toISOString(),
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
  indiceProxyAtual: 0
};

function registrarLog(tipo, contexto, mensagem, detalhe = "") {
  const hora = horaAtualBR();
  const tipoNorm = tipo === "ERRO" ? "INESPERADO" : (tipo === "AVISO" ? "ESPERADO" : tipo);
  const tagMercado = EH_FORT ? "FORT" : "KOCH";
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

async function absorverEnxameNoMaestro() {
  if (TOTAL_WORKERS <= 1) {
    return {
      maquinasAtivas: 1,
      todosConcluidos: sessao.status === "CONCLUIDO" || sessao.status === "CANCELADO_SALVO",
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

  const resumoMaquinas = [{
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
  }];

  sessao.ultimosNovos.forEach((n) => novosMap.set(n.id, n));
  sessao.ultimosPrecosAlterados.forEach((p) => precosMap.set(p.id, p));

  let maquinasAtivas = (sessao.status === "RODANDO" || sessao.status === "BLOQUEIO_ESPERA") ? 1 : 0;
  let workersFinalizados = (sessao.status === "CONCLUIDO" || sessao.status === "CANCELADO_SALVO") ? 1 : 0;
  let workersVistos = 1;

  for (let w = 2; w <= TOTAL_WORKERS; w++) {
    const wk = enxameDados[`worker_${w}`];
    if (!wk || wk.swarmId !== SWARM_RUN_ID) continue;
    workersVistos++;

    const idadeMs = Date.now() - Number(wk.heartbeatMs || 0);
    const ativo = (wk.status === "RODANDO" || wk.status === "BLOQUEIO_ESPERA" || wk.status === "INICIANDO") && idadeMs < 180000;
    if (ativo) maquinasAtivas++;
    if (wk.status === "CONCLUIDO" || wk.status === "CANCELADO_SALVO" || idadeMs >= 240000) {
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
        const hashW = `${prodW.preco}_${prodW.estoque}_${(prodW.categorias || []).length}`;
        const jaVistoHash = deltasJaContabilizadosMaestro.get(prodW.id);
        const existenteMestre = mapaProdutos.get(prodW.id);

        if (!existenteMestre) {
          mapaProdutos.set(prodW.id, prodW);
          deltasJaContabilizadosMaestro.set(prodW.id, hashW);
          sessao.novosDesdeUltimoSave++;
        } else if (jaVistoHash !== hashW) {
          const catsUnidas = Array.from(new Set([...(existenteMestre.categorias || []), ...(prodW.categorias || [])]));
          const histUnido = atualizarHistoricoSemDuplicarConsecutivos(
            { ...(existenteMestre.historicoPrecos || {}), ...(prodW.historicoPrecos || {}) },
            dataHojeISO,
            Number(prodW.preco || existenteMestre.preco || 0)
          );
          mapaProdutos.set(prodW.id, {
            ...existenteMestre,
            ...prodW,
            categorias: catsUnidas,
            historicoPrecos: histUnido
          });
          deltasJaContabilizadosMaestro.set(prodW.id, hashW);
          sessao.atualizadosDesdeUltimoSave++;
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
      heartbeatMs: wk.heartbeatMs || Date.now()
    });
  }

  sessao.totalAtualNoBanco = mapaProdutos.size;
  const todosConcluidos = workersVistos >= TOTAL_WORKERS && workersFinalizados >= TOTAL_WORKERS;

  logsCombinados.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

  return {
    maquinasAtivas: Math.max(1, maquinasAtivas),
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
      resumoMaquinas: enxame.resumoMaquinas
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
    if (!EH_FORT) {
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
      ROTAS_ATIVAS = cmd.rotas;
      sessao.rotaTotal = ROTAS_ATIVAS.length;
      recalcularFatiaDoWorker();
      registrarLog("OK", "Fila", `Fila atualizada remotamente pelo painel (${ROTAS_ATIVAS.length} categorias).`);
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "RESETAR_FILA") {
      ROTAS_ATIVAS = obterRotasFiltradasPorModo(CONFIG.modoFila);
      sessao.rotaTotal = ROTAS_ATIVAS.length;
      recalcularFatiaDoWorker();
      sessao.irParaRotaIndice = sessao.meuIndiceInicio;
      sessao.pularRotaAtual = true;
      sessao.progressoRotas = {};
      registrarLog("OK", "Fila", `Fila restaurada (${ROTAS_ATIVAS.length} categorias no modo ${CONFIG.modoFila}).`);
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

function recalcularFatiaDoWorker() {
  const totalRotas = ROTAS_ATIVAS.length;
  if (totalRotas === 0) {
    sessao.meuIndiceInicio = 0;
    sessao.meuIndiceFim = 0;
    return;
  }
  const tamanhoFatiaBase = Math.floor(totalRotas / TOTAL_WORKERS);
  const resto = totalRotas % TOTAL_WORKERS;

  let inicio = 0;
  for (let i = 1; i < WORKER_ID; i++) {
    inicio += tamanhoFatiaBase + (i <= resto ? 1 : 0);
  }
  const meuTamanho = tamanhoFatiaBase + (WORKER_ID <= resto ? 1 : 0);
  const fim = Math.min(totalRotas - 1, inicio + meuTamanho - 1);

  sessao.meuIndiceInicio = inicio;
  sessao.meuIndiceFim = fim;
  sessao.rotaIndiceAtual = Math.max(inicio, Math.min(fim, CONFIG.startIndex));
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

  try {
    const rCmd = await fetch(authUrl(FIREBASE_COMANDOS_ENDPOINT));
    if (rCmd.ok) {
      const cAntigo = await rCmd.json();
      if (cAntigo && (cAntigo.id || cAntigo.timestamp)) {
        sessao.ultimoComandoIdProcessado = Number(cAntigo.id || cAntigo.timestamp || 0);
      }
      if (cAntigo?.config) {
        if (Number(cAntigo.config.salvarAoAdicionar) >= 1) CONFIG.salvarAoAdicionar = Number(cAntigo.config.salvarAoAdicionar);
        if (Number(cAntigo.config.salvarAoAtualizar) >= 1) CONFIG.salvarAoAtualizar = Number(cAntigo.config.salvarAoAtualizar);
        if (Number(cAntigo.config.size) >= 12) CONFIG.size = Math.min(MAX_ALLOWED_SIZE, Number(cAntigo.config.size));
        if (cAntigo.config.modoFila && !process.env.MODO_FILA) CONFIG.modoFila = String(cAntigo.config.modoFila).toUpperCase();
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

  ROTAS_ATIVAS = obterRotasFiltradasPorModo(CONFIG.modoFila, filaCustomSalva);
  sessao.rotaTotal = ROTAS_ATIVAS.length;
  recalcularFatiaDoWorker();

  registrarLog(
    "OK",
    "Divisão do Enxame",
    `${MERCADO_NOME} • Modo Fila: ${CONFIG.modoFila} (${ROTAS_ATIVAS.length} rotas totais | Lote size=${CONFIG.size}). Máquina #${WORKER_ID}/${TOTAL_WORKERS} cuidará das rotas #${sessao.meuIndiceInicio + 1} até #${sessao.meuIndiceFim + 1}.`
  );

  const dados = await resp.json();
  if (dados && Array.isArray(dados.produtos)) {
    if (SOU_MAESTRO) {
      const arqBackup = EH_FORT ? "backup_fort_1644_antes.json" : "backup_koch_1408_antes.json";
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
      historicoPrecos: historico
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
        ...sessao.ultimosPrecosAlterados.slice(0, 30),
        ...sessao.ultimosNovos.slice(0, 20)
      ];
      await fetch(authUrl(`${FIREBASE_BASE}/robo_controle/ultimas_alteracoes_${EH_FORT ? "fort" : "koch"}.json`), {
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
    if (fimDeRota || sessao.novosDesdeUltimoSave >= 1 || sessao.atualizadosDesdeUltimoSave >= 20) {
      await publicarEstadoWorkerNoEnxame();
      sessao.novosDesdeUltimoSave = 0;
      sessao.atualizadosDesdeUltimoSave = 0;
    }
    return;
  }

  if (TOTAL_WORKERS > 1) {
    await absorverEnxameNoMaestro();
  }

  const atingiuMetaNovos = sessao.novosDesdeUltimoSave >= CONFIG.salvarAoAdicionar;
  const atingiuMetaAtualizados = sessao.atualizadosDesdeUltimoSave >= CONFIG.salvarAoAtualizar;

  if (!atingiuMetaNovos && !atingiuMetaAtualizados) return;

  const tempoDesdeUltimoSave = Date.now() - sessao.ultimoSaveMs;
  if (!fimDeRota && tempoDesdeUltimoSave < CONFIG.cooldownSaveMs) return;

  const motivoDetalhe = atingiuMetaNovos
    ? `+${sessao.novosDesdeUltimoSave} novo(s) (${contextoCurto})`
    : `${sessao.atualizadosDesdeUltimoSave} atualizados (${contextoCurto})`;

  await gravarComSegurancaNoFirebase(motivoDetalhe);
}

function montarUrlOficial({ storePath = DEFAULT_STORE_PATH, promo = false, size = CONFIG.size, from = 0, categoryId = "", categoryName = "" }) {
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
  q.push(`size=${size}`);
  q.push(`from=${from}`);
  q.push("search=");
  q.push("sortField=sales_count");
  q.push("sortOrder=desc");
  if (categoryId && categoryId !== "PROMO_FORT") q.push(`categoryId=${encodeURIComponent(categoryId)}`);
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
// EXECUÇÃO PRINCIPAL DO ROBÔ INVISÍVEL
// =========================================================================
async function executarRoboCloud() {
  await detectarIpPublico();
  registrarLog("OK", "Rede", `IP Público detectado para Máquina #${WORKER_ID}: ${WORKER_PUBLIC_IP}`);

  if (WORKER_ID > 1) {
    await dormir((WORKER_ID - 1) * 1200);
  }

  await carregarProtegerFirebaseInicial();
  await enviarTelemetriaAoVivo(true);

  if (sessao.meuIndiceInicio >= ROTAS_ATIVAS.length || sessao.meuIndiceInicio > sessao.meuIndiceFim) {
    sessao.status = "CONCLUIDO";
    sessao.mensagem = `Máquina #${WORKER_ID} (${WORKER_PUBLIC_IP}) sem rotas pendentes nesta divisão.`;
    await enviarTelemetriaAoVivo(true);
    return;
  }

  const userAgentNativo = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${129 + (WORKER_ID % 3)}.0.0.0 Safari/537.36`;

  registrarLog("OK", "Navegador", `Iniciando navegador da Máquina #${WORKER_ID}/${TOTAL_WORKERS} (IP: ${WORKER_PUBLIC_IP})...`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
  });

  const context = await browser.newContext({
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    userAgent: userAgentNativo,
    viewport: { width: 1366, height: 768 }
  });

  // INJEÇÃO ANTECIPADA DO COOKIE DA LOJA CORRETA (1644 no Fort ou 1408 no Koch)
  await context.addCookies([
    {
      name: COOKIE_LOJA_NOME,
      value: COOKIE_LOJA_VALOR,
      domain: COOKIE_LOJA_DOMINIO,
      path: "/"
    }
  ]);

  const page = await context.newPage();
  let tokenCapturado = "";
  let storePath = DEFAULT_STORE_PATH;

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("sense.osuper.com.br") && url.includes("/v2/search")) {
      try {
        const u = new URL(url);
        storePath = u.pathname;
      } catch {}
    }
    const tk = req.headers()["x-osuper-identity-token"] || req.headers()["x-osuper-search-token"];
    if (tk && tk !== tokenCapturado) {
      tokenCapturado = tk;
      registrarLog("OK", "Token", `Token de busca capturado via tráfego de rede.`);
    }
  });

  async function renovarSessaoETokenAutomatico(motivoRenovacao = "Token solicitado") {
    try {
      registrarLog("AVISO", "Token", `${motivoRenovacao} — Coletando novo token...`);
      tokenCapturado = "";

      // 1. FAST-PATH HTTP: Extração instantânea sem peso de renderizar navegador (~300ms)
      if (EH_FORT) {
        try {
          const resHome = await fetch(SITE_URL, {
            headers: {
              "User-Agent": userAgentNativo,
              "Cookie": `${COOKIE_LOJA_NOME}=${COOKIE_LOJA_VALOR}`
            },
            signal: AbortSignal.timeout(8000)
          });
          if (resHome.ok) {
            const html = await resHome.text();
            const m = html.match(/"searchEngineToken"\s*:\s*"([^"]+)"/);
            if (m && m[1] && m[1].startsWith("v1.334.1644.")) {
              tokenCapturado = m[1];
              registrarLog("OK", "Token", `Token Fort obtido em 300ms (Loja 1644 confirmada): ${tokenCapturado.slice(0, 24)}...`);
              return;
            }
          }
        } catch (eHttp) {
          registrarLog("AVISO", "Token", `Fast-path HTTP oscilou (${eHttp.message}). Recorrendo ao navegador...`);
        }
      } else {
        // SuperKoch GraphQL Fast-Path
        try {
          const rGql = await fetch("https://api.superkoch.com.br:443/storefront/graphql", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "User-Agent": userAgentNativo,
              "Accept": "*/*"
            },
            body: JSON.stringify({
              operationName: "SearchIdentityTokenQuery",
              variables: {},
              query: "query SearchIdentityTokenQuery { customerViewer { id searchIdentityToken } }"
            }),
            signal: AbortSignal.timeout(8000)
          });
          if (rGql.ok) {
            const jGql = await rGql.json();
            const tkGql = jGql?.data?.customerViewer?.searchIdentityToken;
            if (tkGql) {
              tokenCapturado = tkGql;
              registrarLog("OK", "Token", `Token Koch obtido via GraphQL em 300ms.`);
              return;
            }
          }
        } catch {}
      }

      // 2. Fallback Playwright DOM
      await page.goto(SITE_URL, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
      await dormirHumano(2500);

      const tkEval = await page.evaluate(async (ehFort) => {
        try {
          if (ehFort) {
            return window.INITIAL_STATE?.app?.searchEngineToken || "";
          } else {
            return window.INITIAL_STATE?.auth?.searchIdentityToken || "";
          }
        } catch { return ""; }
      }, EH_FORT);

      if (tkEval) {
        tokenCapturado = tkEval;
        registrarLog("OK", "Token", `Token obtido via SSR HTML (${EH_FORT ? "searchEngineToken" : "searchIdentityToken"}).`);
      }
    } catch (e) {
      registrarLog("ERRO", "Token", `Erro ao tentar renovar sessão: ${e.message}`);
    }
  }

  sessao.status = "RODANDO";
  sessao.mensagem = `Máquina #${WORKER_ID}/${TOTAL_WORKERS} (${WORKER_PUBLIC_IP}) conectando ao ${MERCADO_NOME}...`;
  await enviarTelemetriaAoVivo(true);

  await renovarSessaoETokenAutomatico("Inicialização do Robô");

  async function consultarAPINoPontoExato(url, rotulo, pag, from) {
    let tentativa = 0;
    while (!sessao.pularRotaAtual && !sessao.canceladoRemoto) {
      tentativa++;
      await aguardarSePausadoRemoto();
      if (sessao.pularRotaAtual || sessao.canceladoRemoto) return null;

      sessao.requisicoesFeitas++;
      let resultado = { ok: false, status: 0, error: "Sem resposta" };

      // 1. MOTOR PRIMÁRIO: Fetch Direto Node.js (Ultra-rápido, sem CORS/CSP de navegador, ~200ms)
      try {
        const headers = {
          "Accept": "application/json, text/plain, */*",
          "User-Agent": userAgentNativo,
          "Origin": SITE_URL,
          "Referer": `${SITE_URL}/`
        };
        if (tokenCapturado) headers[HEADER_TOKEN_NAME] = tokenCapturado;
        const res = await fetch(url, { method: "GET", headers, signal: AbortSignal.timeout(12000) });
        if (res.ok) {
          const data = await res.json();
          resultado = { ok: true, status: 200, data };
        } else {
          resultado = { ok: false, status: res.status, error: `HTTP ${res.status}` };
        }
      } catch (errDirect) {
        // 2. MOTOR SECUNDÁRIO: Playwright context.request (compartilha sessão/cookies HTTP nativos)
        try {
          const respContext = await context.request.get(url, {
            headers: {
              "Accept": "application/json, text/plain, */*",
              [HEADER_TOKEN_NAME]: tokenCapturado || ""
            },
            timeout: 15000
          });
          if (respContext.ok()) {
            const data = await respContext.json();
            resultado = { ok: true, status: 200, data };
          } else {
            resultado = { ok: false, status: respContext.status() };
          }
        } catch (errContext) {
          // 3. MOTOR TERCIÁRIO: page.evaluate no navegador
          try {
            resultado = await page.evaluate(async ({ targetUrl, tk, headerName }) => {
              try {
                const h = { accept: "application/json, text/plain, */*" };
                if (tk) h[headerName] = tk;
                const r = await fetch(targetUrl, { method: "GET", headers: h });
                if (!r.ok) return { ok: false, status: r.status };
                const data = await r.json();
                return { ok: true, status: 200, data };
              } catch (err) {
                return { ok: false, status: 0, error: err.message };
              }
            }, { targetUrl: url, tk: tokenCapturado, headerName: HEADER_TOKEN_NAME });
          } catch (evalErr) {
            resultado = { ok: false, status: 0, error: evalErr.message };
          }
        }
      }

      if (resultado.ok && resultado.data) {
        if (sessao.status === "BLOQUEIO_ESPERA") sessao.status = "RODANDO";
        return resultado.data;
      }

      if (CONFIG.usarProxy && tentativa === 1 && url.includes("?url=")) {
        try {
          const urlDireta = decodeURIComponent(url.split("url=")[1]);
          url = urlDireta;
          registrarLog("AVISO", rotulo, `Proxy oscilou na Pág ${pag}. Tentando conexão direta...`);
          continue;
        } catch {}
      }

      // Trata 401 / 403 (Token Expirado)
      if (resultado.status === 401 || resultado.status === 403) {
        registrarLog("AVISO", rotulo, `Token inválido/expirado (HTTP ${resultado.status}). Renovando token...`);
        await renovarSessaoETokenAutomatico(`HTTP ${resultado.status} em ${rotulo} (Pág ${pag})`);
        if (tentativa <= 2) {
          await dormirHumano(2500);
          continue;
        } else {
          registrarLog("AVISO", rotulo, `3 tentativas com erro de token em ${rotulo}. Pulando categoria com segurança.`);
          return null;
        }
      }

      // Trata Erros de Rede, 429 ou 5xx com respiro inteligente sem travar por 5 minutos
      if (resultado.status === 0 || resultado.status === 429 || resultado.status >= 500) {
        const descErro = resultado.status === 0
          ? `Erro de Rede (${resultado.error || "Falha de conexão"})`
          : `Servidor HTTP ${resultado.status}`;

        if (tentativa === 1) {
          registrarLog("AVISO", rotulo, `${descErro} na Pág ${pag}. Respiro rápido de 3s e nova tentativa...`);
          await dormirHumano(3000);
          continue;
        } else if (tentativa === 2) {
          registrarLog("AVISO", rotulo, `${descErro} na Pág ${pag}. Renovando token e aguardando 6s...`);
          await renovarSessaoETokenAutomatico("Falha de conexão na API");
          await dormirHumano(6000);
          continue;
        } else {
          registrarLog("AVISO", rotulo, `Tentativa 3 falhou em ${rotulo} (Pág ${pag}): ${descErro}. Pulando categoria para não travar o robô.`);
          return null;
        }
      }

      registrarLog("AVISO", rotulo, `Resposta HTTP ${resultado.status} na Pág ${pag}. Continuando...`);
      return null;
    }
    return null;
  }

  // =======================================================================
  // LAÇO PRINCIPAL: VARREDURA SEQUENCIAL DAS ROTAS DA MÁQUINA
  // =======================================================================
  try {
    for (let rIdx = sessao.rotaIndiceAtual; rIdx <= sessao.meuIndiceFim; rIdx++) {
      await verificarComandosRemotos();
      await aguardarSePausadoRemoto();
      if (sessao.canceladoRemoto) break;

      if (sessao.irParaRotaIndice !== null && sessao.irParaRotaIndice >= 0) {
        rIdx = Math.max(sessao.meuIndiceInicio, Math.min(sessao.meuIndiceFim, sessao.irParaRotaIndice));
        sessao.irParaRotaIndice = null;
      }

      sessao.pularRotaAtual = false;
      const rota = ROTAS_ATIVAS[rIdx];
      if (!rota) continue;

      sessao.rotaIndiceAtual = rIdx;
      sessao.rotaNomeAtual = rota.nome;
      sessao.rotaUrlAtual = rota.url;
      sessao.deptoAtualNome = rota.depto || "Geral";
      sessao.paginaAtual = 1;
      sessao.totalPaginasEstimadoRota = 1;
      sessao.offsetAtual = 0;

      const rotulo = `Rota #${rIdx + 1}/${ROTAS_ATIVAS.length} • ${rota.nome}`;
      registrarLog("OK", rotulo, `Acessando categoria: ${rota.url}`);

      sessao.progressoRotas[rIdx] = {
        st: "rodando",
        nome: rota.nome,
        depto: rota.depto,
        url: rota.url,
        lidos: 0,
        novos: 0,
        precos: 0,
        pags: 1,
        inicioEm: horaAtualBR(),
        worker: WORKER_ID
      };

      await enviarTelemetriaAoVivo(true);

      const ehHomeOuIndex = rota.tipo === "home" || rota.tipo === "categorias_index";
      const ehPromo = rota.tipo === "promocoes" || rota.tipo === "promocao";

      let from = 0;
      let pag = 1;
      let totalItensEstimado = null;
      let totalLidosRota = 0;
      let novosRota = 0;
      let precosRota = 0;

      const categoryNameParam = (rota.tipo === "sub" || rota.tipo === "depto") && !rota.id ? rota.nome : "";
      const categoryIdParam = (rota.id && rota.id !== "PROMO_FORT") ? String(rota.id) : "";

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
          categoryId: categoryIdParam,
          categoryName: categoryNameParam
        });

        sessao.status = "RODANDO";
        sessao.mensagem = `Coletando ${rota.nome} • Pág ${pag} (off ${from}) • ${mapaProdutos.size} prods no banco...`;
        await enviarTelemetriaAoVivo(false);

        const dados = await consultarAPINoPontoExato(urlAPI, rotulo, pag, from);
        if (!dados) {
          registrarLog("AVISO", rotulo, `Sem resposta na Pág ${pag}. Avançando para a próxima categoria.`);
          break;
        }

        const hits = Array.isArray(dados.products)
          ? dados.products
          : (Array.isArray(dados.hits) ? dados.hits : (Array.isArray(dados.items) ? dados.items : []));

        if (totalItensEstimado === null && typeof dados.total === "number") {
          totalItensEstimado = dados.total;
          sessao.totalPaginasEstimadoRota = Math.max(1, Math.ceil(totalItensEstimado / CONFIG.size));
        }

        if (hits.length === 0) {
          if (pag === 1) {
            registrarLog("OK", rotulo, `Categoria sem produtos no momento (0 itens).`);
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
        }

        await verificarAutoSaveInteligente(`${rota.nome} Pág ${pag}`, false);
        await enviarTelemetriaAoVivo(false);

        from += hits.length;
        pag++;

        if (ehHomeOuIndex) {
          if (pag > 3) break;
        }

        if (hits.length < CONFIG.size) {
          break;
        }

        if (totalItensEstimado !== null && from >= totalItensEstimado) {
          break;
        }

        await dormirHumano(CONFIG.delayMs);
      }

      sessao.progressoRotas[rIdx] = {
        st: sessao.pularRotaAtual ? "skip" : "ok",
        nome: rota.nome,
        depto: rota.depto,
        url: rota.url,
        lidos: totalLidosRota,
        novos: novosRota,
        precos: precosRota,
        pags: Math.max(1, pag - 1),
        fimEm: horaAtualBR(),
        worker: WORKER_ID
      };

      registrarLog("OK", rotulo, `Concluída: ${totalLidosRota} itens em ${Math.max(1, pag - 1)} pág(s) (+${novosRota} novos | 🔄 ${precosRota} preços).`);

      await verificarAutoSaveInteligente(rota.nome, true);

      if (SOU_MAESTRO && CONFIG.autoSaveEveryDepto && (rota.tipo === "depto" || rota.tipo === "promocoes" || rota.tipo === "promocao") && (sessao.novosDesdeUltimoSave > 0 || sessao.atualizadosDesdeUltimoSave > 0)) {
        await gravarComSegurancaNoFirebase(`Fim de ${rota.nome}`);
      }

      await enviarTelemetriaAoVivo(true);
      await dormirHumano(CONFIG.delayTrocaRotaMs);
    }

    if (!SOU_MAESTRO) {
      sessao.status = "CONCLUIDO";
      sessao.mensagem = `✅ Máquina #${WORKER_ID}/${TOTAL_WORKERS} concluiu sua fatia (#${sessao.meuIndiceInicio + 1} a #${sessao.meuIndiceFim + 1})!`;
      registrarLog("OK", "Fatia Concluída", sessao.mensagem);
      await publicarEstadoWorkerNoEnxame();
      return;
    }

    if (SOU_MAESTRO && TOTAL_WORKERS > 1) {
      registrarLog("OK", "Maestro do Enxame", `Máquina #1 concluiu sua fatia. Coordenando e salvando dados das demais máquinas do enxame...`);
      for (let esperaCiclo = 0; esperaCiclo < 720 && !sessao.canceladoRemoto; esperaCiclo++) {
        await aguardarSePausadoRemoto();
        const enxame = await absorverEnxameNoMaestro();
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
    const enxameFinal = await absorverEnxameNoMaestro();
    sessao.status = "CONCLUIDO";
    sessao.mensagem = `🎉 ${MERCADO_NOME} Concluído (${TOTAL_WORKERS} máq. | Modo ${CONFIG.modoFila})! ${mapaProdutos.size} produtos no banco (+${enxameFinal.novosGlobal} novos, 🔄 ${enxameFinal.precosGlobal} preços).`;
    registrarLog("OK", "Finalizado", sessao.mensagem);
    await enviarTelemetriaAoVivo(true);

    // Se ambos os bancos existirem e não for um radar relâmpago, executa a vinculação inteligente
    if (SOU_MAESTRO && !EH_MODO_RADAR) {
      try {
        await executarVinculacaoInteligente();
      } catch (eLink) {
        registrarLog("AVISO", "Vinculação", `Vinculação automática pós-extração: ${eLink.message}`);
      }
    }
  } finally {
    await browser.close();
  }
}

// =========================================================================
// ALGORITMO MULTI-FATOR DE VINCULAÇÃO INTELIGENTE KOCH × FORT
// =========================================================================
const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "com", "para", "em", "sem", "ao", "aos",
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "e", "ou", "por", "sobre"
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

function extrairAssetHash(urlImg) {
  if (!urlImg || typeof urlImg !== "string") return null;
  const m = urlImg.match(/([0-9a-f]{5,10}-[0-9a-f]{6,16}|[0-9a-f]{20,40})\.(webp|png|jpg|jpeg)/i);
  return m ? m[1].toLowerCase() : null;
}

function extrairGramatura(nome) {
  if (!nome) return null;
  const n = normalizarTexto(nome);
  const mPack = n.match(/(\d+)\s*x\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|lt|ml)/i);
  if (mPack) {
    const qtd = parseFloat(mPack[1]);
    const val = parseFloat(mPack[2].replace(",", "."));
    const un = mPack[3].toLowerCase();
    let totalBase = un.startsWith("k") || un === "l" || un === "lt" ? val * 1000 : val;
    return { valorNorm: Math.round(qtd * totalBase), unidade: un.includes("l") ? "ml" : "g", str: `${qtd}x${val}${un}` };
  }
  const m = n.match(/\b(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|ml)\b/i);
  if (m) {
    const val = parseFloat(m[1].replace(",", "."));
    const un = m[2].toLowerCase();
    if (un.startsWith("k") || un === "l" || un === "lt") {
      return { valorNorm: Math.round(val * 1000), unidade: un.includes("l") ? "ml" : "g", str: `${val}${un}` };
    }
    return { valorNorm: Math.round(val), unidade: un.includes("l") ? "ml" : "g", str: `${val}${un}` };
  }
  return null;
}

function calcularScoreCasamento(prodK, prodF) {
  let score = 0;
  const motivos = [];

  // 1. Gramatura (Eliminatória!)
  const gramK = extrairGramatura(prodK.nome);
  const gramF = extrairGramatura(prodF.nome);

  if (gramK && gramF) {
    if (gramK.unidade === gramF.unidade) {
      if (Math.abs(gramK.valorNorm - gramF.valorNorm) <= 1) {
        score += 30;
        motivos.push(`Gramatura idêntica (${gramK.str})`);
      } else {
        return { score: 0, motivo: "Gramaturas incompatíveis" };
      }
    } else {
      return { score: 0, motivo: "Unidades incompatíveis" };
    }
  } else if (!gramK && !gramF) {
    const unK = String(prodK.unidade || "UN").toUpperCase();
    const unF = String(prodF.unidade || "UN").toUpperCase();
    if (unK === unF) {
      score += 15;
    }
  } else {
    score += 5;
  }

  // 2. Hash da Imagem no Catálogo OSuper
  const hashK = extrairAssetHash(prodK.imagem);
  const hashF = extrairAssetHash(prodF.imagem);
  if (hashK && hashF && hashK === hashF) {
    score += 45;
    motivos.push("Foto idêntica no catálogo OSuper");
  }

  // 3. Marca
  const marcaK = normalizarTexto(prodK.marca);
  const marcaF = normalizarTexto(prodF.marca);
  if (marcaK && marcaF && marcaK !== "generico" && marcaF !== "generico") {
    if (marcaK === marcaF) {
      score += 20;
      motivos.push(`Marca idêntica (${prodK.marca})`);
    } else {
      score -= 25;
    }
  }

  // 4. Tokens do Nome (Jaccard)
  const tokensK = new Set(normalizarTexto(prodK.nome).split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w)));
  const tokensF = new Set(normalizarTexto(prodF.nome).split(/\s+/).filter((w) => w.length >= 3 && !STOPWORDS.has(w)));

  if (tokensK.size > 0 && tokensF.size > 0) {
    let intersecao = 0;
    for (const t of tokensK) {
      if (tokensF.has(t)) intersecao++;
    }
    const uniao = new Set([...tokensK, ...tokensF]).size;
    const jaccard = uniao > 0 ? intersecao / uniao : 0;
    const ptsTokens = Math.round(jaccard * 25);
    score += ptsTokens;
    if (jaccard >= 0.5) {
      motivos.push(`Nomes similares (${Math.round(jaccard * 100)}%)`);
    }
  }

  return {
    score: Math.min(100, Math.max(0, score)),
    motivo: motivos.join(" + ") || "Similaridade geral"
  };
}

export async function executarVinculacaoInteligente(firebaseBase = FIREBASE_BASE) {
  console.log("🔗 Iniciando vinculação inteligente Koch × Fort...");

  let respKoch = null;
  let respFort = null;
  let respVinc = null;

  try {
    [respKoch, respFort, respVinc] = await Promise.all([
      fetch(authUrl(`${firebaseBase}/koch_loja_1408.json`)),
      fetch(authUrl(`${firebaseBase}/fort_loja_1644.json`)),
      fetch(authUrl(`${firebaseBase}/vinculos_produtos.json`)).catch(() => null)
    ]);
  } catch (err) {
    console.log(`⚠️ Erro de conexão ao buscar catálogos para vincular: ${err.message}`);
    return null;
  }

  if (!respKoch || !respKoch.ok || !respFort || !respFort.ok) {
    console.log("⚠️ Um dos catálogos ainda não está disponível no Firebase para vincular.");
    return null;
  }

  const dadosKoch = await respKoch.json();
  const dadosFort = await respFort.json();
  const dadosVinc = respVinc && respVinc.ok ? await respVinc.json() : null;

  const prodsKoch = Array.isArray(dadosKoch?.produtos) ? dadosKoch.produtos : [];
  const prodsFort = Array.isArray(dadosFort?.produtos) ? dadosFort.produtos : [];

  if (prodsKoch.length === 0 || prodsFort.length === 0) {
    console.log("⚠️ Catálogos insuficientes para cruzamento.");
    return null;
  }

  console.log(`📊 Cruzando ${prodsKoch.length} itens do Koch com ${prodsFort.length} itens do Fort...`);

  const manuaisExistentes = dadosVinc?.manuais || {};
  const rejeitadosExistentes = dadosVinc?.rejeitados || {};

  const mapaFortPorAsset = new Map();
  const mapaFortPorMarca = new Map();

  for (const f of prodsFort) {
    if (!f || !f.id) continue;
    const asset = extrairAssetHash(f.imagem);
    if (asset) {
      if (!mapaFortPorAsset.has(asset)) mapaFortPorAsset.set(asset, []);
      mapaFortPorAsset.get(asset).push(f);
    }
    const marcaNorm = normalizarTexto(f.marca);
    if (marcaNorm && marcaNorm.length > 2 && marcaNorm !== "generico") {
      if (!mapaFortPorMarca.has(marcaNorm)) mapaFortPorMarca.set(marcaNorm, []);
      mapaFortPorMarca.get(marcaNorm).push(f);
    }
  }

  const vinculosFinais = [];
  const mapaKochParaFort = {};
  const mapaFortParaKoch = {};
  const fortJaCasados = new Set();

  for (const [idK, idF] of Object.entries(manuaisExistentes)) {
    mapaKochParaFort[idK] = idF;
    mapaFortParaKoch[idF] = idK;
    fortJaCasados.add(String(idF));
    vinculosFinais.push({
      idKoch: String(idK),
      idFort: String(idF),
      score: 100,
      motivo: "Vínculo Manual Confirmado",
      manual: true,
      data: new Date().toISOString()
    });
  }

  for (const k of prodsKoch) {
    if (!k || !k.id) continue;
    const idK = String(k.id);
    if (mapaKochParaFort[idK]) continue;

    let melhorFort = null;
    let melhorScore = 0;
    let melhorMotivo = "";

    const assetK = extrairAssetHash(k.imagem);
    const marcaK = normalizarTexto(k.marca);

    const candidatos = new Set();
    if (assetK && mapaFortPorAsset.has(assetK)) {
      for (const f of mapaFortPorAsset.get(assetK)) candidatos.add(f);
    }
    if (marcaK && mapaFortPorMarca.has(marcaK)) {
      for (const f of mapaFortPorMarca.get(marcaK)) candidatos.add(f);
    }

    if (candidatos.size === 0) {
      const palavrasFortes = normalizarTexto(k.nome).split(/\s+/).filter((w) => w.length >= 4 && !STOPWORDS.has(w));
      if (palavrasFortes.length > 0) {
        const primeiraPalavra = palavrasFortes[0];
        for (const f of prodsFort) {
          if (f && f.nome && f.nome.toLowerCase().includes(primeiraPalavra)) {
            candidatos.add(f);
            if (candidatos.size > 30) break;
          }
        }
      }
    }

    for (const f of candidatos) {
      const idF = String(f.id);
      if (fortJaCasados.has(idF)) continue;
      const chavePar = `${idK}__${idF}`;
      if (rejeitadosExistentes[chavePar]) continue;

      const res = calcularScoreCasamento(k, f);
      if (res.score > melhorScore) {
        melhorScore = res.score;
        melhorFort = f;
        melhorMotivo = res.motivo;
      }
    }

    if (melhorScore >= 70 && melhorFort) {
      const idF = String(melhorFort.id);
      mapaKochParaFort[idK] = idF;
      mapaFortParaKoch[idF] = idK;
      fortJaCasados.add(idF);
      vinculosFinais.push({
        idKoch: idK,
        idFort: idF,
        score: melhorScore,
        motivo: melhorMotivo,
        manual: false,
        data: new Date().toISOString()
      });
    }
  }

  const payload = {
    atualizadoEm: new Date().toISOString(),
    totalVinculos: vinculosFinais.length,
    vinculos: vinculosFinais,
    mapaKochParaFort,
    mapaFortParaKoch,
    manuais: manuaisExistentes,
    rejeitados: rejeitadosExistentes
  };

  try {
    await fetch(authUrl(FIREBASE_VINCULOS_ENDPOINT), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log(`✅ Sucesso! ${vinculosFinais.length} vínculos de produtos salvos no Firebase (${FIREBASE_VINCULOS_ENDPOINT}).`);
  } catch (err) {
    console.log(`❌ Erro ao salvar vínculos no Firebase: ${err.message}`);
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
