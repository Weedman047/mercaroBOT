// =========================================================================
// NETLIFY SERVERLESS FUNCTION: Consulta e Atualização de Preço Sob Demanda (Ao Vivo)
// Bypassa consultas massivas: atualiza o produto exatamente quando o usuário clica nele!
// =========================================================================

const FIREBASE_URL = "https://mercaro-e6035-default-rtdb.firebaseio.com";
const FIREBASE_SECRET = "avPevwfA57FK4v9O3Me9dBVmhOM2NmpJJc19AqEh";

const CONFIG_LOJAS = {
  koch: {
    contaId: "295",
    lojaId: "1408",
    storePath: "/295/1408/v2/search",
    cookieName: "st_295",
    cookieValue: "%7B%22id%22%3A%221408%22%2C%22userSelected%22%3Atrue%7D",
    siteUrl: "https://www.superkoch.com.br",
    tabelaFirebase: "koch_loja_1408"
  },
  fort: {
    contaId: "334",
    lojaId: "1644",
    storePath: "/334/1644/v2/search",
    cookieName: "st_334",
    cookieValue: "%7B%22id%22%3A%221644%22%2C%22userSelected%22%3Atrue%7D",
    siteUrl: "https://www.fortatacadista.com.br",
    tabelaFirebase: "fort_loja_1644"
  }
};

function buildFirebaseUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${FIREBASE_URL}${p}${FIREBASE_SECRET ? (p.includes("?") ? `&auth=${FIREBASE_SECRET}` : `?auth=${FIREBASE_SECRET}`) : ""}`;
}

async function obterTokenValido(mercadoKey, cfg) {
  // 1. Tenta obter o token mais recente salvo pelo Robô no Firebase
  try {
    const resFb = await fetch(buildFirebaseUrl(`/robo_controle/tokens/${mercadoKey}.json`), {
      signal: AbortSignal.timeout(3000)
    });
    if (resFb.ok) {
      const data = await resFb.json();
      if (data && data.token && typeof data.token === "string" && data.token.length > 20) {
        return data.token;
      }
    }
  } catch {}

  // 2. Fallback: extrai da homepage da loja
  try {
    const resHome = await fetch(cfg.siteUrl, {
      headers: {
        "cookie": `${cfg.cookieName}=${cfg.cookieValue}`,
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(4500)
    });
    if (resHome.ok) {
      const html = await resHome.text();
      const m = html.match(/"searchEngineToken"\s*:\s*"([^"]+)"/) || html.match(/"searchIdentityToken"\s*:\s*"([^"]+)"/);
      if (m && m[1]) return m[1];
    }
  } catch {}

  return "";
}

export const handler = async (event) => {
  const headersCors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: headersCors, body: "" };
  }

  const params = event.queryStringParameters || {};
  const lojaParam = String(params.loja || params.mercado || "koch").toLowerCase();
  const mercadoKey = lojaParam.includes("fort") ? "fort" : "koch";
  const cfg = CONFIG_LOJAS[mercadoKey];

  const idProd = String(params.id || "").trim();
  const termoBusca = String(params.termo || params.nome || idProd).trim();

  if (!idProd && !termoBusca) {
    return {
      statusCode: 400,
      headers: headersCors,
      body: JSON.stringify({ ok: false, erro: "Informe o parâmetro 'id' ou 'termo'." })
    };
  }

  const agoraISO = new Date().toISOString();

  try {
    const token = await obterTokenValido(mercadoKey, cfg);
    const urlBusca = `https://sense.osuper.com.br${cfg.storePath}?search=${encodeURIComponent(idProd || termoBusca)}&size=3`;

    const headersReq = {
      "accept": "application/json, text/plain, */*",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    };
    if (token) {
      headersReq["x-osuper-search-token"] = token;
    }

    const resOSuper = await fetch(urlBusca, {
      headers: headersReq,
      signal: AbortSignal.timeout(5000)
    });

    if (resOSuper.ok) {
      const data = await resOSuper.json();
      const produtos = Array.isArray(data.products) ? data.products : (Array.isArray(data.items) ? data.items : []);
      
      let item = null;
      if (idProd) {
        item = produtos.find((p) => String(p.id) === idProd);
      }
      if (!item && produtos.length > 0) {
        item = produtos[0];
      }

      if (item && item.id) {
        const precoNormal = Number(item.pricing?.price || item.pricing?.normalPrice || 0);
        const precoPromo = Number(item.pricing?.promotionalPrice || item.activePrice || precoNormal);

        let precoClube = 0;
        if (Array.isArray(item.personaPromotions) && item.personaPromotions.length > 0) {
          const pC = Number(item.personaPromotions[0]?.price || item.personaPromotions[0]?.promotionalPrice || 0);
          if (pC > 0) precoClube = pC;
        }

        let precoVuon = null;
        if (Array.isArray(item.paymentPromotions) && item.paymentPromotions.length > 0) {
          const pV = Number(item.paymentPromotions[0]?.price || item.paymentPromotions[0]?.promotionalPrice || 0);
          if (pV > 0) precoVuon = pV;
        } else if (Array.isArray(item.paymentConditionalPrices) && item.paymentConditionalPrices.length > 0) {
          const pV = Number(item.paymentConditionalPrices[0]?.price || 0);
          if (pV > 0) precoVuon = pV;
        }

        const precosCandidatos = [precoClube, precoPromo, precoNormal].filter((x) => x > 0);
        const precoFinal = precosCandidatos.length > 0 ? Math.min(...precosCandidatos) : precoNormal;
        const precoOrig = precoNormal > precoFinal ? precoNormal : precoFinal;
        const estoque = item.quantity?.inStock ?? 0;

        // Atualiza no Firebase RTDB em background
        const patchPayload = {
          preco: precoFinal,
          precoOriginal: precoOrig,
          precoClube: precoClube > 0 ? precoClube : null,
          precoVuon: precoVuon > 0 ? precoVuon : null,
          estoque,
          atualizadoEm: agoraISO
        };

        fetch(buildFirebaseUrl(`/${cfg.tabelaFirebase}/produtos/${item.id}.json`), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchPayload)
        }).catch(() => {});

        return {
          statusCode: 200,
          headers: headersCors,
          body: JSON.stringify({
            ok: true,
            id: String(item.id),
            loja: mercadoKey,
            nome: item.name || "",
            preco: precoFinal,
            precoOriginal: precoOrig,
            precoClube: precoClube > 0 ? precoClube : null,
            precoVuon: precoVuon > 0 ? precoVuon : null,
            estoque,
            emPromocao: precoFinal < precoOrig,
            atualizadoEm: agoraISO,
            fonte: "osuper_live"
          })
        };
      }
    }
  } catch (err) {
    // Falha de rede ou timeout com a API do mercado -> consulta o cache do Firebase
  }

  // Fallback seguro: lê o cache existente do Firebase para nunca quebrar a interface
  if (idProd) {
    try {
      const resCache = await fetch(buildFirebaseUrl(`/${cfg.tabelaFirebase}/produtos/${idProd}.json`), {
        signal: AbortSignal.timeout(3000)
      });
      if (resCache.ok) {
        const prod = await resCache.json();
        if (prod) {
          const ultDataHist = prod.historicoPrecos && typeof prod.historicoPrecos === "object"
            ? Object.keys(prod.historicoPrecos).sort().pop()
            : null;
          return {
            statusCode: 200,
            headers: headersCors,
            body: JSON.stringify({
              ok: true,
              id: idProd,
              loja: mercadoKey,
              nome: prod.nome || "",
              preco: Number(prod.preco || 0),
              precoOriginal: Number(prod.precoOriginal || prod.preco || 0),
              precoClube: prod.precoClube ? Number(prod.precoClube) : null,
              precoVuon: prod.precoVuon ? Number(prod.precoVuon) : null,
              estoque: Number(prod.estoque ?? 0),
              atualizadoEm: prod.atualizadoEm || (ultDataHist ? (ultDataHist.includes("T") ? ultDataHist : `${ultDataHist}T12:00:00.000Z`) : agoraISO),
              fallback: true,
              fonte: "firebase_cache"
            })
          };
        }
      }
    } catch {}
  }

  return {
    statusCode: 200,
    headers: headersCors,
    body: JSON.stringify({
      ok: false,
      id: idProd,
      loja: mercadoKey,
      mensagem: "Não foi possível sincronizar o produto no momento.",
      fonte: "nenhuma"
    })
  };
};
