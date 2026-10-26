// =========================================================================
// 4. ROBÔ EXTRATOR V7 (SEQUENCIAL POR LINKS/CATEGORIAS + ROLAGEM + CHECKPOINT EXATO)
// =========================================================================
async function roboExtratorInfiltradoV6(fbBaseUrl, mercadoForcado = null, authSecretForcado = null) {
  const isFort = mercadoForcado ? mercadoForcado === "fort" : window.location.hostname.includes("fortatacadista");
  const mercado = isFort ? "fort" : "koch";
  const mercadoNome = isFort ? "Fort Atacadista (Porto Belo 1644)" : "SuperKoch (Itapema 1408)";
  const mercadoIcone = isFort ? "🟢" : "🔴";
  const contaId = isFort ? "334" : "295";
  const lojaIdPadrao = isFort ? "1644" : "1408";

  const authSecret = (authSecretForcado || localStorage.getItem('koch_firebase_secret') || '').trim();
  const comAuth = (url) => {
    if (!authSecret) return url;
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}auth=${encodeURIComponent(authSecret)}`;
  };

  const baseLimpa = fbBaseUrl.replace(/\/$/, '').replace(/\/koch_loja_1408\.json$/, '').replace(/\/fort_loja_1644\.json$/, '');
  const FIREBASE_ENDPOINT = isFort ? baseLimpa + "/fort_loja_1644.json" : baseLimpa + "/koch_loja_1408.json";
  const FIREBASE_TELEMETRIA_ENDPOINT = isFort ? baseLimpa + "/robo_controle/telemetria_fort.json" : baseLimpa + "/robo_controle/telemetria_koch.json";
  const FIREBASE_COMANDOS_ENDPOINT = isFort ? baseLimpa + "/robo_controle/comandos_fort.json" : baseLimpa + "/robo_controle/comandos.json";
  const CHECKPOINT_STORAGE_KEY = isFort ? "fort_robo_checkpoint_v7" : "koch_robo_checkpoint_v7";
  const headerTokenKey = isFort ? "x-osuper-search-token" : "x-osuper-identity-token";

  const ROTAS_PADRAO_KOCH = [
  { url: "https://www.superkoch.com.br/", pathReal: "/", tipo: "home", id: null, depto: "Página Inicial", nome: "Página Inicial (Home)" },
  { url: "https://www.superkoch.com.br/categorias", pathReal: "/categorias", tipo: "categorias_index", id: null, depto: "Categorias", nome: "Índice Geral de Categorias" },

  // Eletro
  { url: "https://www.superkoch.com.br/categorias/eletro", pathReal: "/categorias/eletro", tipo: "depto", id: "3660261", depto: "Eletro", nome: "Eletro (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/eletro/smart-tv", pathReal: "/categorias/eletro/smart-tv", tipo: "sub", id: "3660262", depto: "Eletro", nome: "Eletro > Smart Tv" },
  { url: "https://www.superkoch.com.br/categorias/eletro/ar-condicionado", pathReal: "/categorias/eletro/ar-condicionado", tipo: "sub", id: "3660264", depto: "Eletro", nome: "Eletro > Ar Condicionado" },
  { url: "https://www.superkoch.com.br/categorias/eletro/eletroportateis", pathReal: "/categorias/eletro/eletroportateis", tipo: "sub", id: "3660265", depto: "Eletro", nome: "Eletro > Eletroportáteis" },
  { url: "https://www.superkoch.com.br/categorias/eletro/forno-e-micro-ondas", pathReal: "/categorias/eletro/forno-e-microondas", tipo: "sub", id: "3660289", depto: "Eletro", nome: "Eletro > Forno e Micro-ondas" },
  { url: "https://www.superkoch.com.br/categorias/eletro/informatica-e-eletronicos", pathReal: "/categorias/eletro/informatica-e-eletronicos", tipo: "sub", id: "3660291", depto: "Eletro", nome: "Eletro > Informática e Eletrônicos" },
  { url: "https://www.superkoch.com.br/categorias/eletro/beleza-e-cuidado-pessoais", pathReal: "/categorias/eletro/beleza-e-cuidado-pessoais", tipo: "sub", id: "3660293", depto: "Eletro", nome: "Eletro > Beleza e Cuidado Pessoais" },
  { url: "https://www.superkoch.com.br/categorias/eletro/cooktop", pathReal: "/categorias/eletro/cooktop", tipo: "sub", id: "3660294", depto: "Eletro", nome: "Eletro > Cooktop" },
  { url: "https://www.superkoch.com.br/categorias/eletro/adega", pathReal: "/categorias/eletro/adega", tipo: "sub", id: "3660295", depto: "Eletro", nome: "Eletro > Adega" },
  { url: "https://www.superkoch.com.br/categorias/eletro/centrifuga-e-secadora", pathReal: "/categorias/eletro/centrifuga-e-secadora", tipo: "sub", id: "3660296", depto: "Eletro", nome: "Eletro > Centrifuga e Secadora" },

  // Hortifruti
  { url: "https://www.superkoch.com.br/categorias/hortifruti", pathReal: "/categorias/hortifruti", tipo: "depto", id: "3659965", depto: "Hortifruti", nome: "Hortifruti (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/frutas", pathReal: "/categorias/hortifruti/frutas", tipo: "sub", id: "3659966", depto: "Hortifruti", nome: "Hortifruti > Frutas" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/legumes", pathReal: "/categorias/hortifruti/legumes", tipo: "sub", id: "3660005", depto: "Hortifruti", nome: "Hortifruti > Legumes" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/ovos", pathReal: "/categorias/hortifruti/ovos", tipo: "sub", id: "3660040", depto: "Hortifruti", nome: "Hortifruti > Ovos" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/verduras", pathReal: "/categorias/hortifruti/verduras", tipo: "sub", id: "3660045", depto: "Hortifruti", nome: "Hortifruti > Verduras" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/flores-plantas-e-sementes", pathReal: "/categorias/hortifruti/flores-plantas-e-sementes", tipo: "sub", id: "3660081", depto: "Hortifruti", nome: "Hortifruti > Flores, Plantas e Sementes" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/organicos", pathReal: "/categorias/hortifruti/organicos", tipo: "sub", id: "3660086", depto: "Hortifruti", nome: "Hortifruti > Orgânicos" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/frutas-secas", pathReal: "/categorias/hortifruti/frutas-secas", tipo: "sub", id: "3660121", depto: "Hortifruti", nome: "Hortifruti > Frutas Secas" },

  // Açougue
  { url: "https://www.superkoch.com.br/categorias/acougue", pathReal: "/categorias/acougue", tipo: "depto", id: "3886562", depto: "Açougue", nome: "Açougue (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/acougue/carnes-bovinas", pathReal: "/categorias/acougue/carnes-bovinas", tipo: "sub", id: "3886563", depto: "Açougue", nome: "Açougue > Carnes Bovinas" },
  { url: "https://www.superkoch.com.br/categorias/acougue/frango", pathReal: "/categorias/acougue/frango", tipo: "sub", id: "3886569", depto: "Açougue", nome: "Açougue > Frango" },
  { url: "https://www.superkoch.com.br/categorias/acougue/carne-suina", pathReal: "/categorias/acougue/carne-suina", tipo: "sub", id: "3886577", depto: "Açougue", nome: "Açougue > Carne Suína" },
  { url: "https://www.superkoch.com.br/categorias/acougue/linguica", pathReal: "/categorias/acougue/linguica", tipo: "sub", id: "3886580", depto: "Açougue", nome: "Açougue > Linguiça" },
  { url: "https://www.superkoch.com.br/categorias/acougue/pao-de-alho", pathReal: "/categorias/acougue/pao-de-alho", tipo: "sub", id: "3886592", depto: "Açougue", nome: "Açougue > Pão de Alho" },
  { url: "https://www.superkoch.com.br/categorias/acougue/peixes-e-frutos-do-mar", pathReal: "/categorias/acougue/peixes-e-frutos-do-mar", tipo: "sub", id: "3886583", depto: "Açougue", nome: "Açougue > Peixes e Frutos do Mar" },
  { url: "https://www.superkoch.com.br/categorias/acougue/queijo-coalho", pathReal: "/categorias/acougue/queijo-coalho", tipo: "sub", id: "3886586", depto: "Açougue", nome: "Açougue > Queijo Coalho" },
  { url: "https://www.superkoch.com.br/categorias/acougue/carnes-especiais-e-aves", pathReal: "/categorias/acougue/carnes-especiais-aves-comemo", tipo: "sub", id: "3886588", depto: "Açougue", nome: "Açougue > Carnes Especiais & Aves" },

  // Frios e Laticínios
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios", pathReal: "/categorias/frios-laticinios", tipo: "depto", id: "3659907", depto: "Frios & Laticínios", nome: "Frios & Laticínios (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/leite", pathReal: "/categorias/frios-laticinios/leite", tipo: "sub", id: "3659921", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Leite" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/queijos", pathReal: "/categorias/frios-laticinios/queijos", tipo: "sub", id: "3659908", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Queijos" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/iogurte", pathReal: "/categorias/frios-laticinios/iogurte", tipo: "sub", id: "3659928", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Iogurte" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/embutidos", pathReal: "/categorias/frios-laticinios/embutidos", tipo: "sub", id: "3659941", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Embutidos" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/requeijao-e-queijo-cremoso", pathReal: "/categorias/frios-laticinios/requeijao-queijo-cremoso", tipo: "sub", id: "3659952", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Requeijão & Queijo Cremoso" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/defumados", pathReal: "/categorias/frios-laticinios/defumados", tipo: "sub", id: "3659953", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Defumados" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/manteiga-e-nata", pathReal: "/categorias/frios-laticinios/manteiga-nata", tipo: "sub", id: "3659954", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Manteiga & Nata" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/margarina", pathReal: "/categorias/frios-laticinios/margarina", tipo: "sub", id: "3659955", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Margarina" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/achocolatados", pathReal: "/categorias/frios-laticinios/achocolatados", tipo: "sub", id: "3659956", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Achocolatados" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/bebidas-proteicas", pathReal: "/categorias/frios-laticinios/bebidas-proteicas", tipo: "sub", id: "3659957", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Bebidas Proteicas" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/massas-frescas", pathReal: "/categorias/frios-laticinios/massas-frescas", tipo: "sub", id: "3659959", depto: "Frios & Laticínios", nome: "Frios & Laticínios > Massas Frescas" },

  // Congelados
  { url: "https://www.superkoch.com.br/categorias/congelados", pathReal: "/categorias/congelados", tipo: "depto", id: "3660359", depto: "Congelados", nome: "Congelados (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/congelados/pizza", pathReal: "/categorias/congelados/pizza", tipo: "sub", id: "3660362", depto: "Congelados", nome: "Congelados > Pizza" },
  { url: "https://www.superkoch.com.br/categorias/congelados/pratos-prontos", pathReal: "/categorias/congelados/pratos-prontos", tipo: "sub", id: "3660363", depto: "Congelados", nome: "Congelados > Pratos Prontos" },
  { url: "https://www.superkoch.com.br/categorias/congelados/empanados", pathReal: "/categorias/congelados/empanados", tipo: "sub", id: "3660364", depto: "Congelados", nome: "Congelados > Empanados" },
  { url: "https://www.superkoch.com.br/categorias/congelados/batatas-congeladas", pathReal: "/categorias/congelados/batatas-congeladas", tipo: "sub", id: "3660366", depto: "Congelados", nome: "Congelados > Batatas Congeladas" },
  { url: "https://www.superkoch.com.br/categorias/congelados/pao-de-queijo", pathReal: "/categorias/congelados/pao-de-queijo", tipo: "sub", id: "3660368", depto: "Congelados", nome: "Congelados > Pão de Queijo" },
  { url: "https://www.superkoch.com.br/categorias/congelados/legumes-congelados", pathReal: "/categorias/congelados/legumes-congelados", tipo: "sub", id: "3660369", depto: "Congelados", nome: "Congelados > Legumes Congelados" },
  { url: "https://www.superkoch.com.br/categorias/congelados/hamburguer", pathReal: "/categorias/congelados/hamburguer", tipo: "sub", id: "3660361", depto: "Congelados", nome: "Congelados > Hamburguer" },
  { url: "https://www.superkoch.com.br/categorias/congelados/waffle", pathReal: "/categorias/congelados/waffle", tipo: "sub", id: "3660370", depto: "Congelados", nome: "Congelados > Waffle" },
  { url: "https://www.superkoch.com.br/categorias/congelados/salgados", pathReal: "/categorias/congelados/salgados", tipo: "sub", id: "3660371", depto: "Congelados", nome: "Congelados > Salgados" },
  { url: "https://www.superkoch.com.br/categorias/congelados/paes", pathReal: "/categorias/congelados/paes", tipo: "sub", id: "3660372", depto: "Congelados", nome: "Congelados > Pães" },
  { url: "https://www.superkoch.com.br/categorias/congelados/outros", pathReal: "/categorias/congelados/outros", tipo: "sub", id: "3660360", depto: "Congelados", nome: "Congelados > Outros" },

  // Mercearia
  { url: "https://www.superkoch.com.br/categorias/mercearia", pathReal: "/categorias/mercearia", tipo: "depto", id: "3659759", depto: "Mercearia", nome: "Mercearia (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/cafes", pathReal: "/categorias/mercearia/cafes", tipo: "sub", id: "3659760", depto: "Mercearia", nome: "Mercearia > Cafés" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/alimentos-basicos", pathReal: "/categorias/mercearia/alimentos-basicos", tipo: "sub", id: "3659766", depto: "Mercearia", nome: "Mercearia > Alimentos Básicos" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/azeite-oleo-e-vinagre", pathReal: "/categorias/mercearia/azeite-oleo-e-vinagre", tipo: "sub", id: "3659773", depto: "Mercearia", nome: "Mercearia > Azeite, Óleo e Vinagre" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/confeitaria", pathReal: "/categorias/mercearia/confeitaria", tipo: "sub", id: "3659778", depto: "Mercearia", nome: "Mercearia > Confeitaria" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/chocolates-e-doces", pathReal: "/categorias/mercearia/chocolates-e-doces", tipo: "sub", id: "3659796", depto: "Mercearia", nome: "Mercearia > Chocolates e Doces" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/biscoitos-e-torradas", pathReal: "/categorias/mercearia/biscoitos-e-torradas", tipo: "sub", id: "3659801", depto: "Mercearia", nome: "Mercearia > Biscoitos e Torradas" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/matinais-chas-e-achocolatados", pathReal: "/categorias/mercearia/matinais-chas-e-achocolatados", tipo: "sub", id: "3659809", depto: "Mercearia", nome: "Mercearia > Matinais, Chás e Achocolatados" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/molhos-e-condimentos", pathReal: "/categorias/mercearia/molhos-e-condimentos", tipo: "sub", id: "3659820", depto: "Mercearia", nome: "Mercearia > Molhos e Condimentos" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/salgadinhos-e-snacks", pathReal: "/categorias/mercearia/salgadinhos-e-snacks", tipo: "sub", id: "3659828", depto: "Mercearia", nome: "Mercearia > Salgadinhos e Snacks" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/massas", pathReal: "/categorias/mercearia/massas", tipo: "sub", id: "3659834", depto: "Mercearia", nome: "Mercearia > Massas" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/conservas-e-enlatados", pathReal: "/categorias/mercearia/conservas-e-enlatados", tipo: "sub", id: "3659843", depto: "Mercearia", nome: "Mercearia > Conservas e Enlatados" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/acucar-e-adocante", pathReal: "/categorias/mercearia/acucar-e-adocante", tipo: "sub", id: "3659852", depto: "Mercearia", nome: "Mercearia > Açúcar e Adoçante" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/maioneses-ketchups-e-mostarda", pathReal: "/categorias/mercearia/maioneses-ketchups-e-mostarda", tipo: "sub", id: "3659855", depto: "Mercearia", nome: "Mercearia > Maioneses, Ketchups e Mostarda" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/doces-e-geleias", pathReal: "/categorias/mercearia/doces-e-geleias", tipo: "sub", id: "3659859", depto: "Mercearia", nome: "Mercearia > Doces e Geleias" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/natal", pathReal: "/categorias/mercearia/natal", tipo: "sub", id: "3659869", depto: "Mercearia", nome: "Mercearia > Natal" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/pratos-prontos", pathReal: "/categorias/mercearia/pratos-prontos", tipo: "sub", id: "3659872", depto: "Mercearia", nome: "Mercearia > Pratos Prontos" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/mel-e-melado", pathReal: "/categorias/mercearia/mel-e-melado", tipo: "sub", id: "3659875", depto: "Mercearia", nome: "Mercearia > Mel e Melado" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/zero-acucar", pathReal: "/categorias/mercearia/zero-acucar", tipo: "sub", id: "3659877", depto: "Mercearia", nome: "Mercearia > Zero Açúcar" },

  // Limpeza
  { url: "https://www.superkoch.com.br/categorias/limpeza", pathReal: "/categorias/limpeza", tipo: "depto", id: "3660140", depto: "Limpeza", nome: "Limpeza (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/limpeza/limpeza-de-roupas", pathReal: "/categorias/limpeza/limpeza-de-roupas", tipo: "sub", id: "3660141", depto: "Limpeza", nome: "Limpeza > Limpeza de Roupas" },
  { url: "https://www.superkoch.com.br/categorias/limpeza/limpeza-da-casa", pathReal: "/categorias/limpeza/limpeza-da-casa", tipo: "sub", id: "3660150", depto: "Limpeza", nome: "Limpeza > Limpeza da Casa" },
  { url: "https://www.superkoch.com.br/categorias/limpeza/limpeza-da-cozinha", pathReal: "/categorias/limpeza/limpeza-da-cozinha", tipo: "sub", id: "3660161", depto: "Limpeza", nome: "Limpeza > Limpeza da Cozinha" },
  { url: "https://www.superkoch.com.br/categorias/limpeza/limpeza-de-banheiro", pathReal: "/categorias/limpeza/limpeza-de-banheiro", tipo: "sub", id: "3660165", depto: "Limpeza", nome: "Limpeza > Limpeza de Banheiro" },

  // Higiene e Beleza
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza", pathReal: "/categorias/higiene-beleza", tipo: "depto", id: "3660190", depto: "Higiene & Beleza", nome: "Higiene & Beleza (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/papel-higienico", pathReal: "/categorias/higiene-beleza/papel-higienico", tipo: "sub", id: "3660191", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Papel Higiênico" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/corpo", pathReal: "/categorias/higiene-beleza/corpo", tipo: "sub", id: "3660193", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Corpo" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/cabelo", pathReal: "/categorias/higiene-beleza/cabelo", tipo: "sub", id: "3660200", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Cabelo" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/higiene-bucal", pathReal: "/categorias/higiene-beleza/higiene-bucal", tipo: "sub", id: "3660211", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Higiene Bucal" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/intimo", pathReal: "/categorias/higiene-beleza/intimo", tipo: "sub", id: "3660216", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Íntimo" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/barba", pathReal: "/categorias/higiene-beleza/barba", tipo: "sub", id: "3660219", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Barba" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/beleza", pathReal: "/categorias/higiene-beleza/beleza", tipo: "sub", id: "3660222", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Beleza" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/farmacia", pathReal: "/categorias/higiene-beleza/farmacia", tipo: "sub", id: "3660225", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Farmácia" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/cuidados-solares", pathReal: "/categorias/higiene-beleza/cuidados-solares", tipo: "sub", id: "3660227", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Cuidados Solares" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/cuidados-geriatricos", pathReal: "/categorias/higiene-beleza/cuidados-geriatricos", tipo: "sub", id: "3660228", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Cuidados Geriátricos" },
  { url: "https://www.superkoch.com.br/categorias/higiene-e-beleza/infantil", pathReal: "/categorias/higiene-beleza/infantil", tipo: "sub", id: "3660229", depto: "Higiene & Beleza", nome: "Higiene & Beleza > Infantil" },

  // Bebidas
  { url: "https://www.superkoch.com.br/categorias/bebidas", pathReal: "/categorias/bebidas", tipo: "depto", id: "3660169", depto: "Bebidas", nome: "Bebidas (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/refrigerantes", pathReal: "/categorias/bebidas/refrigerantes", tipo: "sub", id: "3660170", depto: "Bebidas", nome: "Bebidas > Refrigerantes" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/agua", pathReal: "/categorias/bebidas/agua", tipo: "sub", id: "3660173", depto: "Bebidas", nome: "Bebidas > Água" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/sucos-e-refrescos", pathReal: "/categorias/bebidas/sucos-e-refrescos", tipo: "sub", id: "3660176", depto: "Bebidas", nome: "Bebidas > Sucos e Refrescos" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/energetico", pathReal: "/categorias/bebidas/energetico", tipo: "sub", id: "3660183", depto: "Bebidas", nome: "Bebidas > Energético" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/agua-de-coco", pathReal: "/categorias/bebidas/agua-de-coco", tipo: "sub", id: "3660186", depto: "Bebidas", nome: "Bebidas > Água de Coco" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/isotonicos", pathReal: "/categorias/bebidas/isotonicos", tipo: "sub", id: "3660187", depto: "Bebidas", nome: "Bebidas > Isotônicos" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/cha-pronto", pathReal: "/categorias/bebidas/cha-pronto", tipo: "sub", id: "3660188", depto: "Bebidas", nome: "Bebidas > Chá Pronto" },
  { url: "https://www.superkoch.com.br/categorias/bebidas/bebida-vegetal", pathReal: "/categorias/bebidas/bebida-vegetal", tipo: "sub", id: "3660189", depto: "Bebidas", nome: "Bebidas > Bebida Vegetal" },

  // Bebidas Alcoólicas
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas", pathReal: "/categorias/bebidas-alcoolicas", tipo: "depto", id: "3660231", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas/cervejas", pathReal: "/categorias/bebidas-alcoolicas/cervejas", tipo: "sub", id: "3660232", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Cervejas" },
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas/vinhos", pathReal: "/categorias/bebidas-alcoolicas/vinhos", tipo: "sub", id: "3660237", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Vinhos" },
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas/destilados", pathReal: "/categorias/bebidas-alcoolicas/destilados", tipo: "sub", id: "3660241", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Destilados" },
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas/champagne-e-espumantes", pathReal: "/categorias/bebidas-alcoolicas/champagne-espumantes", tipo: "sub", id: "3660256", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Champagne & Espumantes" },

  // Casa e Utilidades
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades", pathReal: "/categorias/casa-utilidades", tipo: "depto", id: "3995066", depto: "Casa & Utilidades", nome: "Casa & Utilidades (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/textil", pathReal: "/categorias/casa-utilidades/textil", tipo: "sub", id: "3995128", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Têxtil" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/protecao-contra-chuva", pathReal: "/categorias/casa-utilidades/protecao-contra-chuva", tipo: "sub", id: "3995069", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Proteção Contra Chuva" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/acessorios-de-limpeza", pathReal: "/categorias/casa-utilidades/acessorios-de-limpeza", tipo: "sub", id: "3995071", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Acessórios de Limpeza" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/cozinha", pathReal: "/categorias/casa-utilidades/cozinha", tipo: "sub", id: "3995087", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Cozinha" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/chimarrao-e-cafe", pathReal: "/categorias/casa-utilidades/chimarrao-e-cafe", tipo: "sub", id: "3995096", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Chimarrão e Café" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/praia-piscina-e-camping", pathReal: "/categorias/casa-utilidades/praia-piscina-e-camping", tipo: "sub", id: "3995097", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Praia, Piscina e Camping" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/churrasco", pathReal: "/categorias/casa-utilidades/churrasco", tipo: "sub", id: "3995067", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Churrasco" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/eletricos-e-acessorios", pathReal: "/categorias/casa-utilidades/eletricos-e-acessorios", tipo: "sub", id: "3995102", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Elétricos e Acessórios" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/floricultura-e-jardim", pathReal: "/categorias/casa-utilidades/floricultura-e-jardim", tipo: "sub", id: "3995106", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Floricultura e Jardim" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/calcados", pathReal: "/categorias/casa-utilidades/calcados", tipo: "sub", id: "3995112", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Calçados" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/papelaria", pathReal: "/categorias/casa-utilidades/papelaria", tipo: "sub", id: "3995114", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Papelaria" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/duchas-e-torneiras-eletricas", pathReal: "/categorias/casa-utilidades/duchas-e-torneiras-eletricas", tipo: "sub", id: "3995118", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Duchas e Torneiras Elétricas" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/festa", pathReal: "/categorias/casa-utilidades/festa", tipo: "sub", id: "3995119", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Festa" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/decoracao", pathReal: "/categorias/casa-utilidades/decoracao", tipo: "sub", id: "3995121", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Decoração" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/automotivo", pathReal: "/categorias/casa-utilidades/automotivo", tipo: "sub", id: "3995122", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Automotivo" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/brinquedos", pathReal: "/categorias/casa-utilidades/brinquedos", tipo: "sub", id: "3995124", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Brinquedos" },
  { url: "https://www.superkoch.com.br/categorias/casa-e-utilidades/organizadores", pathReal: "/categorias/casa-utilidades/organizadores", tipo: "sub", id: "3995126", depto: "Casa & Utilidades", nome: "Casa & Utilidades > Organizadores" },

  // Padaria e Confeitaria
  { url: "https://www.superkoch.com.br/categorias/padaria-e-confeitaria", pathReal: "/categorias/padaria-confeitaria", tipo: "depto", id: "3660373", depto: "Padaria & Confeitaria", nome: "Padaria & Confeitaria (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/padaria-e-confeitaria/padaria", pathReal: "/categorias/padaria-confeitaria/padaria", tipo: "sub", id: "3660374", depto: "Padaria & Confeitaria", nome: "Padaria & Confeitaria > Padaria" },
  { url: "https://www.superkoch.com.br/categorias/padaria-e-confeitaria/confeitaria", pathReal: "/categorias/padaria-confeitaria/confeitaria", tipo: "sub", id: "3660381", depto: "Padaria & Confeitaria", nome: "Padaria & Confeitaria > Confeitaria" },

  // Mundo Bebê
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe", pathReal: "/categorias/mundo-bebe", tipo: "depto", id: "3660386", depto: "Mundo Bebê", nome: "Mundo Bebê (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe/fraldas-e-lencos-umedecidos", pathReal: "/categorias/mundo-bebe/fraldas-e-lencos-umedecidos", tipo: "sub", id: "3660387", depto: "Mundo Bebê", nome: "Mundo Bebê > Fraldas e Lenços Umedecidos" },
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe/banho", pathReal: "/categorias/mundo-bebe/banho", tipo: "sub", id: "3660391", depto: "Mundo Bebê", nome: "Mundo Bebê > Banho" },
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe/higiene-oral", pathReal: "/categorias/mundo-bebe/higiene-oral", tipo: "sub", id: "3660396", depto: "Mundo Bebê", nome: "Mundo Bebê > Higiene Oral" },
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe/alimentacao-infantil", pathReal: "/categorias/mundo-bebe/alimentacao-infantil", tipo: "sub", id: "3660397", depto: "Mundo Bebê", nome: "Mundo Bebê > Alimentação Infantil" },
  { url: "https://www.superkoch.com.br/categorias/mundo-bebe/chupetas-e-bicos", pathReal: "/categorias/mundo-bebe/chupetas-bicos", tipo: "sub", id: "3660402", depto: "Mundo Bebê", nome: "Mundo Bebê > Chupetas / Bicos" },

  // Pet Care
  { url: "https://www.superkoch.com.br/categorias/pet-care", pathReal: "/categorias/pet-care", tipo: "depto", id: "3660403", depto: "Pet Care", nome: "Pet Care (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/pet-care/caes", pathReal: "/categorias/pet-care/caes", tipo: "sub", id: "3660404", depto: "Pet Care", nome: "Pet Care > Cães" },
  { url: "https://www.superkoch.com.br/categorias/pet-care/gatos", pathReal: "/categorias/pet-care/gatos", tipo: "sub", id: "3660408", depto: "Pet Care", nome: "Pet Care > Gatos" },

  // Alimentação Especial
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial", pathReal: "/categorias/alimentacao-especial", tipo: "depto", id: "3886594", depto: "Alimentação Especial", nome: "Alimentação Especial (Departamento)" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/suplementos", pathReal: "/categorias/alimentacao-especial/suplementos", tipo: "sub", id: "3886630", depto: "Alimentação Especial", nome: "Alimentação Especial > Suplementos" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/aveia-granola-graos-e-sementes", pathReal: "/categorias/alimentacao-especial/aveia-granola-graos-e-sement", tipo: "sub", id: "3886601", depto: "Alimentação Especial", nome: "Alimentação Especial > Aveia, Granola, Grãos e Sementes" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/fit", pathReal: "/categorias/alimentacao-especial/fit", tipo: "sub", id: "3886595", depto: "Alimentação Especial", nome: "Alimentação Especial > Fit" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/sem-gluten", pathReal: "/categorias/alimentacao-especial/sem-gluten", tipo: "sub", id: "3886605", depto: "Alimentação Especial", nome: "Alimentação Especial > Sem Glúten" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/zero-acucar", pathReal: "/categorias/alimentacao-especial/zero-acucar", tipo: "sub", id: "3886611", depto: "Alimentação Especial", nome: "Alimentação Especial > Zero Açúcar" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/zero-lactose", pathReal: "/categorias/alimentacao-especial/zero-lactose", tipo: "sub", id: "3886615", depto: "Alimentação Especial", nome: "Alimentação Especial > Zero Lactose" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/doces-e-geleias", pathReal: "/categorias/alimentacao-especial/doces-e-geleias", tipo: "sub", id: "3886621", depto: "Alimentação Especial", nome: "Alimentação Especial > Doces e Geleias" },
  { url: "https://www.superkoch.com.br/categorias/alimentacao-especial/integral", pathReal: "/categorias/alimentacao-especial/integral", tipo: "sub", id: "3886623", depto: "Alimentação Especial", nome: "Alimentação Especial > Integral" },

  // Promoções
  { url: "https://www.superkoch.com.br/promocoes", pathReal: "/promocoes", tipo: "promocoes", id: null, depto: "Ofertas", nome: "Promoções (Todas as Ofertas)" }
];
  const ROTAS_PADRAO_FORT = [
  { url: "https://www.fortatacadista.com.br/", pathReal: "/", tipo: "home", id: null, depto: "Página Inicial", nome: "Página Inicial (Home)" },
  { url: "https://www.fortatacadista.com.br/categorias", pathReal: "/categorias", tipo: "categorias_index", id: null, depto: "Categorias", nome: "Índice Geral de Categorias" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia", pathReal: "/categorias/mercearia", tipo: "depto", id: "1812721", depto: "Mercearia", nome: "Mercearia (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/biscoitos-e-salgadinhos", pathReal: "/categorias/mercearia/biscoitos-e-salgadinhos", tipo: "sub", id: "1815254", depto: "Mercearia", nome: "Mercearia > Biscoitos e Salgadinhos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/bomboniere", pathReal: "/categorias/mercearia/bomboniere", tipo: "sub", id: "1815257", depto: "Mercearia", nome: "Mercearia > Bomboniere" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/graos-arrozes-e-feijoes", pathReal: "/categorias/mercearia/graos-arrozes-e-feijoes", tipo: "sub", id: "1815215", depto: "Mercearia", nome: "Mercearia > Grãos, Arrozes e Feijões" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/farinaceos", pathReal: "/categorias/mercearia/farinaceos", tipo: "sub", id: "1815171", depto: "Mercearia", nome: "Mercearia > Farináceos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/geleias-doces-mel-e-cia", pathReal: "/categorias/mercearia/geleias-doces-mel-e-cia", tipo: "sub", id: "1815250", depto: "Mercearia", nome: "Mercearia > Geleias, Doces, Mel e Cia" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/cremes-prontos", pathReal: "/categorias/mercearia/cremes-prontos", tipo: "sub", id: "1815180", depto: "Mercearia", nome: "Mercearia > Cremes Prontos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/conservas-e-enlatados", pathReal: "/categorias/mercearia/conservas-e-enlatados", tipo: "sub", id: "1815199", depto: "Mercearia", nome: "Mercearia > Conservas e Enlatados" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/molhos-para-saladas", pathReal: "/categorias/mercearia/molhos-para-saladas", tipo: "sub", id: "1815188", depto: "Mercearia", nome: "Mercearia > Molhos para Saladas" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/cafes", pathReal: "/categorias/mercearia/cafes", tipo: "sub", id: "1815192", depto: "Mercearia", nome: "Mercearia > Cafés" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/chas", pathReal: "/categorias/mercearia/chas", tipo: "sub", id: "1815205", depto: "Mercearia", nome: "Mercearia > Chás" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/vinagres", pathReal: "/categorias/mercearia/vinagres", tipo: "sub", id: "1815213", depto: "Mercearia", nome: "Mercearia > Vinagres" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/macarrao-e-sopa", pathReal: "/categorias/mercearia/macarrao-e-sopa", tipo: "sub", id: "1815225", depto: "Mercearia", nome: "Mercearia > Macarrão e Sopa" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/oleos", pathReal: "/categorias/mercearia/oleos", tipo: "sub", id: "1815238", depto: "Mercearia", nome: "Mercearia > Óleos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/molhos-passatas-e-atomatados", pathReal: "/categorias/mercearia/molhos-passatas-e-atomatados", tipo: "sub", id: "1815248", depto: "Mercearia", nome: "Mercearia > Molhos, Passatas e Atomatados" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/temperos-secos", pathReal: "/categorias/mercearia/temperos-secos", tipo: "sub", id: "1815249", depto: "Mercearia", nome: "Mercearia > Temperos Secos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/acucares-e-adocantes", pathReal: "/categorias/mercearia/acucares-e-adocantes", tipo: "sub", id: "1815255", depto: "Mercearia", nome: "Mercearia > Açúcares e Adoçantes" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/erva-mate", pathReal: "/categorias/mercearia/erva-mate", tipo: "sub", id: "1815256", depto: "Mercearia", nome: "Mercearia > Erva Mate" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/temperos-em-po", pathReal: "/categorias/mercearia/temperos-em-po", tipo: "sub", id: "1815258", depto: "Mercearia", nome: "Mercearia > Temperos em Pó" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/cereais-sucrilhos-granolas-e-cia", pathReal: "/categorias/mercearia/cereais-sucrilhos-granolas-e-cia", tipo: "sub", id: "1815261", depto: "Mercearia", nome: "Mercearia > Cereais, Sucrilhos, Granolas e Cia" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/panetones-e-chocotones", pathReal: "/categorias/mercearia/panetones-e-chocotones", tipo: "sub", id: "1815262", depto: "Mercearia", nome: "Mercearia > Panetones e Chocotones" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/suplementos", pathReal: "/categorias/mercearia/suplementos", tipo: "sub", id: "1815263", depto: "Mercearia", nome: "Mercearia > Suplementos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/pratos-prontos", pathReal: "/categorias/mercearia/pratos-prontos", tipo: "sub", id: "1815265", depto: "Mercearia", nome: "Mercearia > Pratos Prontos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/azeites", pathReal: "/categorias/mercearia/azeites", tipo: "sub", id: "1815266", depto: "Mercearia", nome: "Mercearia > Azeites" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/molhos", pathReal: "/categorias/mercearia/molhos", tipo: "sub", id: "1815271", depto: "Mercearia", nome: "Mercearia > Molhos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/leites-em-po", pathReal: "/categorias/mercearia/leites-em-po", tipo: "sub", id: "1815287", depto: "Mercearia", nome: "Mercearia > Leites em Pó" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/condimentos", pathReal: "/categorias/mercearia/condimentos", tipo: "sub", id: "1815289", depto: "Mercearia", nome: "Mercearia > Condimentos" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/frutas-em-calda", pathReal: "/categorias/mercearia/frutas-em-calda", tipo: "sub", id: "1815290", depto: "Mercearia", nome: "Mercearia > Frutas em Calda" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/alimentacao-saudavel", pathReal: "/categorias/mercearia/alimentacao-saudavel", tipo: "sub", id: "3103011", depto: "Mercearia", nome: "Mercearia > Alimentação Saudável" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti", pathReal: "/categorias/hortifruti", tipo: "depto", id: "1812709", depto: "Hortifruti", nome: "Hortifruti (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/frutas", pathReal: "/categorias/hortifruti/frutas", tipo: "sub", id: "1815275", depto: "Hortifruti", nome: "Hortifruti > Frutas" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/legumes-e-verduras", pathReal: "/categorias/hortifruti/legumes-e-verduras", tipo: "sub", id: "1815149", depto: "Hortifruti", nome: "Hortifruti > Legumes e Verduras" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/ovos", pathReal: "/categorias/hortifruti/ovos", tipo: "sub", id: "1815148", depto: "Hortifruti", nome: "Hortifruti > Ovos" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/ervas-e-temperos", pathReal: "/categorias/hortifruti/ervas-e-temperos", tipo: "sub", id: "1815155", depto: "Hortifruti", nome: "Hortifruti > Ervas e Temperos" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/oleaginosas", pathReal: "/categorias/hortifruti/oleaginosas", tipo: "sub", id: "1815158", depto: "Hortifruti", nome: "Hortifruti > Oleaginosas" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/cogumelos", pathReal: "/categorias/hortifruti/cogumelos", tipo: "sub", id: "1815276", depto: "Hortifruti", nome: "Hortifruti > Cogumelos" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves", pathReal: "/categorias/carnes-e-aves", tipo: "depto", id: "1812708", depto: "Carnes e Aves", nome: "Carnes e Aves (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/carnes-bovinas", pathReal: "/categorias/carnes-e-aves/carnes-bovinas", tipo: "sub", id: "1815259", depto: "Carnes e Aves", nome: "Carnes e Aves > Carnes Bovinas" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/aves", pathReal: "/categorias/carnes-e-aves/aves", tipo: "sub", id: "1815157", depto: "Carnes e Aves", nome: "Carnes e Aves > Aves" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/carnes-secas-salgadas-e-bacons", pathReal: "/categorias/carnes-e-aves/carnes-secas-salgadas-e-bacons", tipo: "sub", id: "1815264", depto: "Carnes e Aves", nome: "Carnes e Aves > Carnes Secas, Salgadas e Bacons" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/carnes-premium", pathReal: "/categorias/carnes-e-aves/carnes-premium", tipo: "sub", id: "1815147", depto: "Carnes e Aves", nome: "Carnes e Aves > Carnes Premium" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/outras-carnes", pathReal: "/categorias/carnes-e-aves/outras-carnes", tipo: "sub", id: "1815161", depto: "Carnes e Aves", nome: "Carnes e Aves > Outras Carnes" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/carnes-suinas", pathReal: "/categorias/carnes-e-aves/carnes-suinas", tipo: "sub", id: "1815282", depto: "Carnes e Aves", nome: "Carnes e Aves > Carnes Suínas" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/carnes-de-cordeiro", pathReal: "/categorias/carnes-e-aves/carnes-de-cordeiro", tipo: "sub", id: "1815283", depto: "Carnes e Aves", nome: "Carnes e Aves > Carnes de Cordeiro" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-e-aves/embutidos", pathReal: "/categorias/carnes-e-aves/embutidos", tipo: "sub", id: "3071164", depto: "Carnes e Aves", nome: "Carnes e Aves > Embutidos" },
  { url: "https://www.fortatacadista.com.br/categorias/peixes-e-frutos-do-mar", pathReal: "/categorias/peixes-e-frutos-do-mar", tipo: "depto", id: "1812707", depto: "Peixes e Frutos do Mar", nome: "Peixes e Frutos do Mar (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/peixes-e-frutos-do-mar/peixes", pathReal: "/categorias/peixes-e-frutos-do-mar/peixes", tipo: "sub", id: "1815280", depto: "Peixes e Frutos do Mar", nome: "Peixes e Frutos do Mar > Peixes" },
  { url: "https://www.fortatacadista.com.br/categorias/peixes-e-frutos-do-mar/frutos-do-mar", pathReal: "/categorias/peixes-e-frutos-do-mar/frutos-do-mar", tipo: "sub", id: "1815281", depto: "Peixes e Frutos do Mar", nome: "Peixes e Frutos do Mar > Frutos do Mar" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas", pathReal: "/categorias/bebidas-alcoolicas", tipo: "depto", id: "1812716", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/vinhos", pathReal: "/categorias/bebidas-alcoolicas/vinhos", tipo: "sub", id: "1815200", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Vinhos" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/destilados", pathReal: "/categorias/bebidas-alcoolicas/destilados", tipo: "sub", id: "1815229", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Destilados" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/cervejas", pathReal: "/categorias/bebidas-alcoolicas/cervejas", tipo: "sub", id: "1815201", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Cervejas" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/espumantes", pathReal: "/categorias/bebidas-alcoolicas/espumantes", tipo: "sub", id: "1815206", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Espumantes" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/especiarias-para-bebidas", pathReal: "/categorias/bebidas-alcoolicas/especiarias-para-bebidas", tipo: "sub", id: "1815216", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Especiarias para Bebidas" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/bebidas-mistas-e-drinks", pathReal: "/categorias/bebidas-alcoolicas/bebidas-mistas-e-drinks", tipo: "sub", id: "3071167", depto: "Bebidas Alcoólicas", nome: "Bebidas Alcoólicas > Bebidas Mistas e Drinks" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas", pathReal: "/categorias/bebidas-nao-alcoolicas", tipo: "depto", id: "1812710", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/refrigerantes", pathReal: "/categorias/bebidas-nao-alcoolicas/refrigerantes", tipo: "sub", id: "1815230", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Refrigerantes" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/sucos", pathReal: "/categorias/bebidas-nao-alcoolicas/sucos", tipo: "sub", id: "1815233", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Sucos" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/aguas", pathReal: "/categorias/bebidas-nao-alcoolicas/aguas", tipo: "sub", id: "1815234", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Águas" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/energeticos-e-isotonicos", pathReal: "/categorias/bebidas-nao-alcoolicas/energeticos-e-isotonicos", tipo: "sub", id: "1815185", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Energéticos e Isotônicos" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/cafes", pathReal: "/categorias/bebidas-nao-alcoolicas/cafes", tipo: "sub", id: "1815236", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Cafés" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-nao-alcoolicas/chas", pathReal: "/categorias/bebidas-nao-alcoolicas/chas", tipo: "sub", id: "1815235", depto: "Bebidas não Alcoólicas", nome: "Bebidas não Alcoólicas > Chás" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios", pathReal: "/categorias/laticinios-e-frios", tipo: "depto", id: "1812720", depto: "Laticínios e Frios", nome: "Laticínios e Frios (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/iogurte-e-bebidas-lacteas", pathReal: "/categorias/laticinios-e-frios/iogurte-e-bebidas-lacteas", tipo: "sub", id: "1815246", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Iogurte e Bebidas Lácteas" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/leites", pathReal: "/categorias/laticinios-e-frios/leites", tipo: "sub", id: "1815285", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Leites" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/presunto-e-peito-de-peru", pathReal: "/categorias/laticinios-e-frios/presunto-e-peito-de-peru", tipo: "sub", id: "1815239", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Presunto e Peito de Peru" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/cremosos", pathReal: "/categorias/laticinios-e-frios/cremosos", tipo: "sub", id: "1815153", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Cremosos" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/linguicas-e-salsichas", pathReal: "/categorias/laticinios-e-frios/linguicas-e-salsichas", tipo: "sub", id: "1815243", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Linguiças e Salsichas" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/queijos", pathReal: "/categorias/laticinios-e-frios/queijos", tipo: "sub", id: "1815247", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Queijos" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/manteigas-e-margarinas", pathReal: "/categorias/laticinios-e-frios/manteigas-e-margarinas", tipo: "sub", id: "1815251", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Manteigas e Margarinas" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/mortadela-e-pate", pathReal: "/categorias/laticinios-e-frios/mortadela-e-pate", tipo: "sub", id: "1815284", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Mortadela e Patê" },
  { url: "https://www.fortatacadista.com.br/categorias/laticinios-e-frios/salames-e-copas", pathReal: "/categorias/laticinios-e-frios/salames-e-copas", tipo: "sub", id: "1815286", depto: "Laticínios e Frios", nome: "Laticínios e Frios > Salames e Copas" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados", pathReal: "/categorias/congelados", tipo: "depto", id: "1812718", depto: "Congelados", nome: "Congelados (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/massas-e-pizzas-congeladas", pathReal: "/categorias/congelados/massas-e-pizzas-congeladas", tipo: "sub", id: "1815279", depto: "Congelados", nome: "Congelados > Massas e Pizzas Congeladas" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/frutas-legumes-e-vegetais", pathReal: "/categorias/congelados/frutas-legumes-e-vegetais", tipo: "sub", id: "1815163", depto: "Congelados", nome: "Congelados > Frutas, Legumes e Vegetais" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/pratos-prontos-congelados", pathReal: "/categorias/congelados/pratos-prontos-congelados", tipo: "sub", id: "1815278", depto: "Congelados", nome: "Congelados > Pratos Prontos Congelados" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/gelos", pathReal: "/categorias/congelados/gelos", tipo: "sub", id: "1815162", depto: "Congelados", nome: "Congelados > Gelos" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/petiscos-e-salgados-congelados", pathReal: "/categorias/congelados/petiscos-e-salgados-congelados", tipo: "sub", id: "1815168", depto: "Congelados", nome: "Congelados > Petiscos e Salgados Congelados" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/carnes-e-peixes-congelados", pathReal: "/categorias/congelados/carnes-e-peixes-congelados", tipo: "sub", id: "1815172", depto: "Congelados", nome: "Congelados > Carnes e Peixes Congelados" },
  { url: "https://www.fortatacadista.com.br/categorias/congelados/doces-e-sobremesas-geladas", pathReal: "/categorias/congelados/doces-e-sobremesas-geladas", tipo: "sub", id: "1815277", depto: "Congelados", nome: "Congelados > Doces e Sobremesas Geladas" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza", pathReal: "/categorias/limpeza", tipo: "depto", id: "1812719", depto: "Limpeza", nome: "Limpeza (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza/produtos-de-limpeza-domestica", pathReal: "/categorias/limpeza/produtos-de-limpeza-domestica", tipo: "sub", id: "1815242", depto: "Limpeza", nome: "Limpeza > Produtos de Limpeza Doméstica" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza/produtos-de-lavanderia", pathReal: "/categorias/limpeza/produtos-de-lavanderia", tipo: "sub", id: "1815245", depto: "Limpeza", nome: "Limpeza > Produtos de Lavanderia" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza/utensilios-de-limpeza", pathReal: "/categorias/limpeza/utensilios-de-limpeza", tipo: "sub", id: "1815244", depto: "Limpeza", nome: "Limpeza > Utensílios de Limpeza" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza/linha-automotiva", pathReal: "/categorias/limpeza/linha-automotiva", tipo: "sub", id: "1815241", depto: "Limpeza", nome: "Limpeza > Linha Automotiva" },
  { url: "https://www.fortatacadista.com.br/categorias/limpeza/produtos-de-limpeza-especializados", pathReal: "/categorias/limpeza/produtos-de-limpeza-especializados", tipo: "sub", id: "1815253", depto: "Limpeza", nome: "Limpeza > Produtos de Limpeza Especializados" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza", pathReal: "/categorias/higiene-e-beleza", tipo: "depto", id: "1812714", depto: "Higiene e Beleza", nome: "Higiene e Beleza (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/intimos", pathReal: "/categorias/higiene-e-beleza/intimos", tipo: "sub", id: "1815160", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Íntimos" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/banho-e-higiene", pathReal: "/categorias/higiene-e-beleza/banho-e-higiene", tipo: "sub", id: "1815167", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Banho e Higiene" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/acessorios-de-beleza", pathReal: "/categorias/higiene-e-beleza/acessorios-de-beleza", tipo: "sub", id: "1815170", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Acessórios de Beleza" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/maquiagem", pathReal: "/categorias/higiene-e-beleza/maquiagem", tipo: "sub", id: "1815175", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Maquiagem" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/farmacia", pathReal: "/categorias/higiene-e-beleza/farmacia", tipo: "sub", id: "1815176", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Farmácia" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/cuidados-com-as-maos", pathReal: "/categorias/higiene-e-beleza/cuidados-com-as-maos", tipo: "sub", id: "1815177", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Cuidados com as Mãos" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/higiene-bucal", pathReal: "/categorias/higiene-e-beleza/higiene-bucal", tipo: "sub", id: "1815178", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Higiene Bucal" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/desodorantes", pathReal: "/categorias/higiene-e-beleza/desodorantes", tipo: "sub", id: "1815179", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Desodorantes" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/barbearia", pathReal: "/categorias/higiene-e-beleza/barbearia", tipo: "sub", id: "1815202", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Barbearia" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/skincare", pathReal: "/categorias/higiene-e-beleza/skincare", tipo: "sub", id: "1815204", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Skincare" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/cuidados-com-o-cabelo", pathReal: "/categorias/higiene-e-beleza/cuidados-com-o-cabelo", tipo: "sub", id: "1815227", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Cuidados com o Cabelo" },
  { url: "https://www.fortatacadista.com.br/categorias/higiene-e-beleza/cuidado-com-os-pes", pathReal: "/categorias/higiene-e-beleza/cuidado-com-os-pes", tipo: "sub", id: "1815232", depto: "Higiene e Beleza", nome: "Higiene e Beleza > Cuidado com os Pés" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria", pathReal: "/categorias/padaria-e-confeitaria", tipo: "depto", id: "1812712", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/paes", pathReal: "/categorias/padaria-e-confeitaria/paes", tipo: "sub", id: "1815182", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Pães" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/bolos-e-tortas", pathReal: "/categorias/padaria-e-confeitaria/bolos-e-tortas", tipo: "sub", id: "1815183", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Bolos e Tortas" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/salgados", pathReal: "/categorias/padaria-e-confeitaria/salgados", tipo: "sub", id: "1815186", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Salgados" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/doces-e-sobremesas", pathReal: "/categorias/padaria-e-confeitaria/doces-e-sobremesas", tipo: "sub", id: "1815190", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Doces e Sobremesas" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/biscoitos-e-rosquinhas", pathReal: "/categorias/padaria-e-confeitaria/biscoitos-e-rosquinhas", tipo: "sub", id: "1815191", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Biscoitos e Rosquinhas" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/recheios-e-coberturas", pathReal: "/categorias/padaria-e-confeitaria/recheios-e-coberturas", tipo: "sub", id: "1815197", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Recheios e Coberturas" },
  { url: "https://www.fortatacadista.com.br/categorias/padaria-e-confeitaria/fermentos", pathReal: "/categorias/padaria-e-confeitaria/fermentos", tipo: "sub", id: "1815291", depto: "Padaria e Confeitaria", nome: "Padaria e Confeitaria > Fermentos" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades", pathReal: "/categorias/bazar-e-utilidades", tipo: "depto", id: "1812715", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/brinquedos", pathReal: "/categorias/bazar-e-utilidades/brinquedos", tipo: "sub", id: "1815150", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Brinquedos" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/viagens-e-lazer", pathReal: "/categorias/bazar-e-utilidades/viagens-e-lazer", tipo: "sub", id: "1815156", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Viagens e Lazer" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/escola", pathReal: "/categorias/bazar-e-utilidades/escola", tipo: "sub", id: "1815165", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Escola" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/festas-e-aniversarios", pathReal: "/categorias/bazar-e-utilidades/festas-e-aniversarios", tipo: "sub", id: "1815166", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Festas e Aniversários" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/floricultura-e-jardim", pathReal: "/categorias/bazar-e-utilidades/floricultura-e-jardim", tipo: "sub", id: "1815217", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Floricultura e Jardim" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/casa-e-decoracao", pathReal: "/categorias/bazar-e-utilidades/casa-e-decoracao", tipo: "sub", id: "1815218", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Casa e Decoração" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/descartaveis", pathReal: "/categorias/bazar-e-utilidades/descartaveis", tipo: "sub", id: "1815219", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Descartáveis" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/limpeza-e-manutencao", pathReal: "/categorias/bazar-e-utilidades/limpeza-e-manutencao", tipo: "sub", id: "1815240", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Limpeza e Manutenção" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/eletronicos-e-eletrodomesticos", pathReal: "/categorias/bazar-e-utilidades/eletronicos-e-eletrodomesticos", tipo: "sub", id: "1815252", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Eletrônicos e Eletrodomésticos" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/churrasco", pathReal: "/categorias/bazar-e-utilidades/churrasco", tipo: "sub", id: "1815270", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Churrasco" },
  { url: "https://www.fortatacadista.com.br/categorias/bazar-e-utilidades/livros-e-revistas", pathReal: "/categorias/bazar-e-utilidades/livros-e-revistas", tipo: "sub", id: "1815274", depto: "Bazar e Utilidades", nome: "Bazar e Utilidades > Livros e Revistas" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil", pathReal: "/categorias/infantil", tipo: "depto", id: "1812717", depto: "Infantil", nome: "Infantil (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/utensilios-infantis", pathReal: "/categorias/infantil/utensilios-infantis", tipo: "sub", id: "1815159", depto: "Infantil", nome: "Infantil > Utensílios Infantis" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/fraldas-e-troca", pathReal: "/categorias/infantil/fraldas-e-troca", tipo: "sub", id: "1815181", depto: "Infantil", nome: "Infantil > Fraldas e Troca" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/cuidados-com-a-pele-infantil", pathReal: "/categorias/infantil/cuidados-com-a-pele-infantil", tipo: "sub", id: "1815189", depto: "Infantil", nome: "Infantil > Cuidados com a Pele Infantil" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/alimentacao-do-bebe", pathReal: "/categorias/infantil/alimentacao-do-bebe", tipo: "sub", id: "1815193", depto: "Infantil", nome: "Infantil > Alimentação do Bebê" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/higiene-do-bebe", pathReal: "/categorias/infantil/higiene-do-bebe", tipo: "sub", id: "1815237", depto: "Infantil", nome: "Infantil > Higiene do Bebê" },
  { url: "https://www.fortatacadista.com.br/categorias/infantil/banho", pathReal: "/categorias/infantil/banho", tipo: "sub", id: "1815272", depto: "Infantil", nome: "Infantil > Banho" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop", pathReal: "/categorias/petshop", tipo: "depto", id: "1812713", depto: "Petshop", nome: "Petshop (Departamento)" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/alimento-para-passaros-peixes-e-roedores", pathReal: "/categorias/petshop/alimento-para-passaros-peixes-e-roedores", tipo: "sub", id: "1815169", depto: "Petshop", nome: "Petshop > Alimento Para Pássaros, Peixes e Roedores" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/tigelas-e-bebedouros", pathReal: "/categorias/petshop/tigelas-e-bebedouros", tipo: "sub", id: "1815195", depto: "Petshop", nome: "Petshop > Tigelas e Bebedouros" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/alimentos-para-caes", pathReal: "/categorias/petshop/alimentos-para-caes", tipo: "sub", id: "1815196", depto: "Petshop", nome: "Petshop > Alimentos para Cães" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/limpeza-e-higiene", pathReal: "/categorias/petshop/limpeza-e-higiene", tipo: "sub", id: "1815212", depto: "Petshop", nome: "Petshop > Limpeza e Higiene" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/alimentos-para-gatos", pathReal: "/categorias/petshop/alimentos-para-gatos", tipo: "sub", id: "1815220", depto: "Petshop", nome: "Petshop > Alimentos para Gatos" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/escovas-e-pentes", pathReal: "/categorias/petshop/escovas-e-pentes", tipo: "sub", id: "1815221", depto: "Petshop", nome: "Petshop > Escovas e Pentes" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/caminhas-e-colchonetes", pathReal: "/categorias/petshop/caminhas-e-colchonetes", tipo: "sub", id: "1815222", depto: "Petshop", nome: "Petshop > Caminhas e Colchonetes" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/brinquedos", pathReal: "/categorias/petshop/brinquedos", tipo: "sub", id: "1815223", depto: "Petshop", nome: "Petshop > Brinquedos" },
  { url: "https://www.fortatacadista.com.br/categorias/petshop/coleiras-e-guias", pathReal: "/categorias/petshop/coleiras-e-guias", tipo: "sub", id: "1815224", depto: "Petshop", nome: "Petshop > Coleiras e Guias" },
  { url: "https://www.fortatacadista.com.br/categorias/suplementos-esportivos", pathReal: "/categorias/suplementos-esportivos", tipo: "depto", id: "5180817", depto: "Suplementos Esportivos", nome: "Suplementos Esportivos (Departamento)" },
  { url: "https://www.fortatacadista.com.br/promocoes", pathReal: "/promocoes", tipo: "promocoes", id: "PROMO_FORT", depto: "Promoções", nome: "Promoções (Todas as Ofertas)" },
];
  const ROTAS_PADRAO_SEQUENCIAIS = isFort ? ROTAS_PADRAO_FORT : ROTAS_PADRAO_KOCH;

  // Configurações editáveis em tempo real na interface do robô (Padrão Furtivo + Caminhos 2, 3 e 4)
  const config = {
    delayMs: 2200,            // Tempo base entre páginas (2.2s + variação humana aleatória até 3.4s)
    delayTrocaRotaMs: 3800,   // Tempo ao entrar em uma nova categoria/link (3.8s a 5.2s)
    backoffMs: 12000,         // Espera base se der 429 (12s multiplicado pela tentativa)
    maxRetries: 5,            // Tentativas automáticas antes de pausar no ponto exato
    size: 12,                 // Caminho 3: 12 itens pré-selecionado por padrão (aceita 12, 24, 36, 48)
    modoFila: "2A",           // Caminho 2: "2A" (Só Subcategorias + Ofertas - Padrão Ativado), "2B" (Só Departamentos), "COMPLETA" (121 rotas)
    usarProxy: false,         // Caminho 4: Rotação de Proxies / Cloudflare Workers (Desativado por padrão)
    listaProxies: [],         // URLs de Cloudflare Workers / Proxies opcionais
    salvarAoAdicionar: 1,     // Salvar no Firebase ao adicionar X produtos novos
    salvarAoAtualizar: 50,    // Salvar no Firebase ao atualizar X produtos existentes
    cooldownSaveMs: 25000,    // Intervalo mínimo de 25s durante paginação para não pesar
    autoSaveBatch: 50,        // Compatibilidade
    navegarVisualSPA: false,  // Desativado por padrão para NÃO duplicar requisições do React com as do robô
    pararNoLocalExato: true,  // Parar exatamente na página/offset se bloquear ou pedir token
    autoDescobrirNovas: true, // Adicionar categorias extras do APOLLO_STATE se surgirem no site
    repescagemGlobalFinal: false // Desativado por padrão para evitar excesso de requisições no fim
  };

  const obterRotasPorModo = (modo, base121 = ROTAS_PADRAO_SEQUENCIAIS) => {
    const m = String(modo || "2A").toUpperCase();
    if (m === "RADAR" || m === "1" || m === "1A" || m === "OFERTAS") {
      return base121.filter(r => r.tipo === "promocoes" || r.tipo === "home" ||
        (r.tipo === "sub" && (
          r.nome.toLowerCase().includes("bovino") ||
          r.nome.toLowerCase().includes("frango") ||
          r.nome.toLowerCase().includes("fruta") ||
          r.nome.toLowerCase().includes("legume") ||
          r.nome.toLowerCase().includes("leite") ||
          r.nome.toLowerCase().includes("cerveja") ||
          r.nome.toLowerCase().includes("basico") ||
          r.nome.toLowerCase().includes("graos") ||
          r.nome.toLowerCase().includes("cafe")
        ))
      );
    }
    if (m === "2A" || m === "TURNO") return base121.filter(r => r.tipo === "sub" || r.tipo === "promocoes");
    if (m === "2B") return base121.filter(r => r.tipo === "depto" || r.tipo === "promocoes");
    return [...base121];
  };

  // Estado interno de execução + Checkpoint exato + Trava de Segurança do Firebase
  const estado = {
    idExecucao: `browser_${Date.now()}`,
    tempoInicioMs: Date.now(),
    rodando: false,
    pausado: false,
    aguardandoToken: false,
    bloqueioAtivo: false,
    cancelado: false,
    salvarAgora: false,
    pularRotaAtual: false,
    minimizado: false,
    abaAtual: "fila", // 'fila' | 'live' | 'config' | 'logs'
    filtroLog: "TODOS",
    token: "",
    storeId: lojaIdPadrao,
    storePath: isFort ? "/334/1644/v2/search" : "/295/1408/v2/search",
    customerId: "",
    isEmployee: "",
    hidePersonas: "690",
    requisicoesFeitas: 0,
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
    totalInicialFirebase: 0,
    leituraFirebaseConcluida: false,
    ultimosNomes: [],
    ultimosNovos: [],
    ultimosPrecosAlterados: [],
    ultimosEstoquesAlterados: [],
    logs: [],
    contagemLogs: { ESPERADO: 0, INESPERADO: 0, OK: 0 },
    // Checkpoint de posição exata para nunca perder nada
    indiceRotaAtual: 0,
    offsetFromAtual: 0,
    paginaAtualNaRota: 1,
    totalPaginasEstimadoRota: 1,
    ultimoComandoIdProcessado: 0,
    progressoPorRota: {} // { [idx]: { status: 'pendente'|'rodando'|'concluido'|'pausado', lidos: 0, pags: 0, novos: 0, precos: 0 } }
  };

  const mapaProdutos = new Map();
  let rotasAtivas = obterRotasPorModo(config.modoFila, ROTAS_PADRAO_SEQUENCIAIS);
  let indiceProxyAtual = 0;

  // Dicionário rápido para reconhecer URLs (mesmo com variações de slug)
  const normalizarPathUrl = (uStr) => {
    try {
      const limpo = String(uStr || "").trim();
      if (!limpo) return "";
      if (limpo.startsWith("http")) {
        const u = new URL(limpo);
        return u.pathname.replace(/\/$/, "") || "/";
      }
      return (limpo.startsWith("/") ? limpo : "/" + limpo).replace(/\/$/, "") || "/";
    } catch (e) {
      return String(uStr || "").trim();
    }
  };

  const mapaLookupRotas = new Map();
  ROTAS_PADRAO_SEQUENCIAIS.forEach(r => {
    mapaLookupRotas.set(normalizarPathUrl(r.url).toLowerCase(), r);
    mapaLookupRotas.set(normalizarPathUrl(r.pathReal).toLowerCase(), r);
  });

  // Lê o window.APOLLO_STATE da página aberta para enriquecer IDs ou descobrir novas subcategorias
  const sincronizarApolloStateDaPagina = () => {
    try {
      const apollo = window.APOLLO_STATE || window.__APOLLO_STATE__;
      if (!apollo || typeof apollo !== "object") return 0;

      const catsPorRef = {};
      Object.keys(apollo).forEach(k => {
        if (k.startsWith("StorefrontCategory:") && apollo[k]) {
          catsPorRef[k] = apollo[k];
        }
      });

      let novasDescobertas = 0;
      Object.values(catsPorRef).forEach(c => {
        if (!c || !c.id || !c.slug) return;
        const parentRef = c.parent?.__ref;
        const parentObj = parentRef ? catsPorRef[parentRef] : null;
        const pathCalc = parentObj ? `/categorias/${parentObj.slug}/${c.slug}` : `/categorias/${c.slug}`;
        const chave = pathCalc.toLowerCase();

        if (mapaLookupRotas.has(chave)) {
          const existente = mapaLookupRotas.get(chave);
          if (!existente.id) existente.id = String(c.id);
        } else if (config.autoDescobrirNovas && c.visibleInMenu !== false) {
          const novaRota = {
            url: `https://www.superkoch.com.br${pathCalc}`,
            pathReal: pathCalc,
            tipo: parentObj ? "sub" : "depto",
            id: String(c.id),
            depto: parentObj ? parentObj.name : c.name,
            nome: parentObj ? `${parentObj.name} > ${c.name}` : `${c.name} (Departamento)`
          };
          mapaLookupRotas.set(chave, novaRota);
          rotasAtivas.push(novaRota);
          novasDescobertas++;
        }
      });

      // Também detecta a loja selecionada se disponível no INITIAL_STATE
      const initStoreId = window.INITIAL_STATE?.app?.selectedStore?.id;
      if (initStoreId && String(initStoreId) === "1408") {
        estado.storeId = "1408";
      }
      return novasDescobertas;
    } catch (e) {
      return 0;
    }
  };

  // Salva e carrega Checkpoint do localStorage para retomada exata
  const salvarCheckpointLocal = () => {
    try {
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, JSON.stringify({
        indiceRotaAtual: estado.indiceRotaAtual,
        offsetFromAtual: estado.offsetFromAtual,
        paginaAtualNaRota: estado.paginaAtualNaRota,
        progressoPorRota: estado.progressoPorRota,
        salvoEm: new Date().toISOString()
      }));
    } catch (e) {}
  };

  const carregarCheckpointLocal = () => {
    try {
      const raw = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const limparCheckpointLocal = () => {
    try { localStorage.removeItem(CHECKPOINT_STORAGE_KEY); } catch (e) {}
    estado.indiceRotaAtual = 0;
    estado.offsetFromAtual = 0;
    estado.paginaAtualNaRota = 1;
    estado.progressoPorRota = {};
  };

  // Remove instância anterior se existir
  const antigo = document.getElementById("balao-extrator-koch");
  if (antigo) antigo.remove();

  // Cria Popup Moderno e Funcional
  const balao = document.createElement("div");
  balao.id = "balao-extrator-koch";
  balao.style.cssText = "position:fixed;bottom:14px;right:14px;z-index:2147483647;background:#0f172a;color:#f8fafc;border-radius:12px;box-shadow:0 12px 35px rgba(0,0,0,0.85);font-family:system-ui,-apple-system,sans-serif;width:480px;max-width:96vw;max-height:94vh;border:1px solid #334155;overflow:hidden;font-size:11px;line-height:1.35;user-select:none;display:flex;flex-direction:column;";

  balao.innerHTML = `
    <style>
      #balao-extrator-koch * { box-sizing:border-box; transition:none !important; animation:none !important; }
      #balao-extrator-koch input[type="number"], #balao-extrator-koch input[type="text"], #balao-extrator-koch select, #balao-extrator-koch textarea {
        background:#020617; color:#f8fafc; border:1px solid #334155; border-radius:4px; padding:3px 6px; font-size:10.5px; width:100%; outline:none; font-family:inherit;
      }
      #balao-extrator-koch input[type="checkbox"] { accent-color:#22c55e; width:13px; height:13px; cursor:pointer; margin:0; }
      #balao-extrator-koch button { cursor:pointer; font-family:inherit; }
      #balao-extrator-koch .koch-card { background:#1e293b; border:1px solid #334155; border-radius:6px; padding:7px 8px; margin-bottom:6px; }
      #balao-extrator-koch .koch-row { display:flex; align-items:center; justify-content:space-between; gap:6px; margin-top:4px; }
      #balao-extrator-koch .koch-lbl { color:#cbd5e1; font-size:10.5px; }
      #balao-extrator-koch .koch-scroll::-webkit-scrollbar { width:5px; height:5px; }
      #balao-extrator-koch .koch-scroll::-webkit-scrollbar-thumb { background:#475569; border-radius:3px; }
      #balao-extrator-koch .rota-item { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:4px 6px; border-bottom:1px solid #1e293b; font-size:10px; cursor:pointer; }
      #balao-extrator-koch .rota-item:hover { background:#1e293b; }
    </style>

    <!-- HEADER FIXO -->
    <div id="koch-header-bar" style="background:#020617;padding:8px 10px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;cursor:pointer;">
      <div style="display:flex;align-items:center;gap:6px;">
        <span id="koch-dot" style="width:8px;height:8px;border-radius:50%;background:#3b82f6;display:inline-block;"></span>
        <strong style="font-size:12px;color:#fff;letter-spacing:-0.2px;">${mercadoIcone} Robô ${isFort ? "Fort" : "Koch"} V7 • ${isFort ? "Porto Belo" : "Itapema"}</strong>
        <span id="koch-badge-count" style="background:#064e3b;color:#6ee7b7;font-weight:800;font-size:10.5px;padding:1px 6px;border-radius:4px;border:1px solid #047857;">0 itens</span>
        <span id="koch-badge-new" style="background:#1e3a8a;color:#93c5fd;font-weight:700;font-size:10px;padding:1px 5px;border-radius:4px;">+0 novos</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px;">
        <button id="koch-btn-min" title="Minimizar / Expandir" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:4px;width:22px;height:20px;font-weight:bold;">_</button>
        <button id="koch-btn-close" title="Fechar" style="background:#7f1d1d;color:#fecaca;border:1px solid #991b1b;border-radius:4px;width:22px;height:20px;font-weight:bold;">✕</button>
      </div>
    </div>

    <!-- CORPO PRINCIPAL -->
    <div id="koch-body-area" style="display:flex;flex-direction:column;">
      
      <!-- BARRA DE ABAS -->
      <div style="display:grid;grid-template-columns:1.15fr 1.1fr 0.95fr 0.85fr;background:#090d16;border-bottom:1px solid #334155;">
        <button id="koch-tab-fila" style="padding:7px 4px;background:#1e293b;color:#fff;border:none;border-bottom:2px solid #22c55e;font-size:10.5px;font-weight:700;">📑 Categorias (<span id="koch-fila-total">121</span>)</button>
        <button id="koch-tab-live" style="padding:7px 4px;background:transparent;color:#94a3b8;border:none;border-bottom:2px solid transparent;font-size:10.5px;font-weight:700;">📊 Monitor Ao Vivo</button>
        <button id="koch-tab-config" style="padding:7px 4px;background:transparent;color:#94a3b8;border:none;border-bottom:2px solid transparent;font-size:10.5px;font-weight:700;">⚙️ Tempos & Config</button>
        <button id="koch-tab-logs" style="padding:7px 4px;background:transparent;color:#94a3b8;border:none;border-bottom:2px solid transparent;font-size:10.5px;font-weight:700;">📋 Logs (<span id="koch-log-total">0</span>)</button>
      </div>

      <!-- ABA 1: FILA SEQUENCIAL DE LINKS / CATEGORIAS -->
      <div id="koch-view-fila" style="display:flex;flex-direction:column;padding:8px;gap:6px;">
        <!-- SELETOR DAS 3 CAMADAS -->
        <div style="display:flex;gap:4px;background:#020617;padding:3px;border-radius:6px;border:1px solid #1e293b;">
          <button id="koch-camada-btn-radar" style="flex:1;background:#1e293b;color:#fde047;border:1px solid #854d0e;border-radius:4px;padding:3px 2px;font-size:9.5px;font-weight:800;">⚡ Radar (~10)</button>
          <button id="koch-camada-btn-turno" style="flex:1;background:#064e3b;color:#6ee7b7;border:1px solid #059669;border-radius:4px;padding:3px 2px;font-size:9.5px;font-weight:800;">⚖️ Turno 2A</button>
          <button id="koch-camada-btn-completa" style="flex:1;background:#1e293b;color:#94a3b8;border:1px solid #334155;border-radius:4px;padding:3px 2px;font-size:9.5px;font-weight:800;">🌙 Geral (100%)</button>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;">
          <span style="color:#94a3b8;font-size:10px;">Clique em qualquer categoria para iniciar/retomar dela:</span>
          <div style="display:flex;gap:4px;">
            <button id="koch-btn-edit-urls" style="background:#1e293b;color:#38bdf8;border:1px solid #334155;border-radius:4px;padding:2px 6px;font-size:9.5px;font-weight:700;">✏️ Editar</button>
            <button id="koch-btn-reset-checkpoint" title="Zerar progresso e voltar ao Link #1" style="background:#1e293b;color:#fca5a5;border:1px solid #334155;border-radius:4px;padding:2px 6px;font-size:9.5px;font-weight:700;">↺ Resetar</button>
          </div>
        </div>

        <!-- LISTA VISUAL DE CATEGORIAS -->
        <div id="koch-lista-rotas" class="koch-scroll" style="background:#020617;border:1px solid #1e293b;border-radius:6px;height:265px;overflow-y:auto;"></div>

        <!-- EDITOR DE LINKS PERSONALIZADOS (OCULTO POR PADRÃO) -->
        <div id="koch-editor-urls-box" style="display:none;flex-direction:column;gap:5px;">
          <div style="color:#fde047;font-size:10px;font-weight:700;">Cole ou edite a sequência de links (1 por linha ou separados por espaço):</div>
          <textarea id="koch-textarea-urls" class="koch-scroll" style="height:210px;font-family:monospace;font-size:9.5px;line-height:1.4;resize:none;"></textarea>
          <div style="display:flex;justify-content:flex-end;gap:5px;">
            <button id="koch-btn-restore-default-urls" style="background:#334155;color:#cbd5e1;border:none;border-radius:4px;padding:4px 8px;font-size:10px;">Restaurar Padrão (121 links)</button>
            <button id="koch-btn-save-urls" style="background:#22c55e;color:#020617;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:800;">✔ Aplicar Sequência</button>
          </div>
        </div>
      </div>

      <!-- ABA 2: MONITOR AO VIVO + CHECKPOINT EXATO -->
      <div id="koch-view-live" style="display:none;padding:10px;flex-direction:column;gap:7px;">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;text-align:center;">
          <div style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:5px;">
            <div style="color:#94a3b8;font-size:9.5px;">Link / Categoria</div>
            <div id="koch-stat-cats" style="font-weight:800;font-size:12px;color:#4ade80;">0 / 121</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:5px;">
            <div style="color:#94a3b8;font-size:9.5px;">Checkpoint Atual</div>
            <div id="koch-stat-checkpoint" style="font-weight:800;font-size:11px;color:#fb923c;">Pág 1 (offset 0)</div>
          </div>
          <div style="background:#1e293b;border:1px solid #334155;border-radius:6px;padding:5px;">
            <div style="color:#94a3b8;font-size:9.5px;">Requisições API</div>
            <div id="koch-stat-reqs" style="font-weight:800;font-size:12px;color:#38bdf8;">0</div>
          </div>
        </div>

        <!-- ALERTA DE TOKEN OU BLOQUEIO (Aparece somente se precisar de ação ou pausa anti-bloqueio) -->
        <div id="koch-alerta-parada" style="display:none;background:#422006;border:1px solid #eab308;color:#fef08a;border-radius:6px;padding:7px 8px;font-size:10.5px;">
          <div id="koch-alerta-titulo" style="font-weight:800;color:#fde047;margin-bottom:2px;">⚠️ Parado no ponto exato para proteção</div>
          <div id="koch-alerta-desc" style="color:#fef9c3;font-size:10px;">Aguardando...</div>
        </div>

        <div style="background:#090d16;border:1px solid #1e293b;border-radius:6px;padding:6px 8px;">
          <div id="koch-etapa-atual" style="color:#fde047;font-weight:800;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            Pronto para iniciar na sequência personalizada...
          </div>
          <div id="koch-url-atual" style="color:#38bdf8;font-size:9.5px;font-family:monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">
            https://www.superkoch.com.br/
          </div>
          <div id="koch-status-msg" style="color:#cbd5e1;font-size:10.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:3px;">
            Clique em ▶ Iniciar para percorrer todas as categorias e subcategorias.
          </div>
        </div>

        <div style="background:#1e293b;height:7px;border-radius:4px;overflow:hidden;border:1px solid #334155;">
          <div id="koch-progress-bar" style="background:#22c55e;width:0%;height:100%;"></div>
        </div>

        <div id="koch-live-items" style="background:#020617;border:1px solid #1e293b;border-radius:6px;padding:6px 8px;height:90px;display:flex;flex-direction:column;justify-content:flex-start;gap:3px;font-size:10px;color:#94a3b8;overflow:hidden;font-family:monospace;">
          <div style="color:#64748b;">Aguardando início da captura...</div>
        </div>
      </div>

      <!-- ABA 3: CONFIGURAÇÕES E TEMPOS ANTI-BLOQUEIO -->
      <div id="koch-view-config" class="koch-scroll" style="display:none;padding:9px;max-height:310px;overflow-y:auto;">
        <div class="koch-card" style="border-color:#475569;background:#090d16;">
          <div style="font-weight:800;color:#38bdf8;font-size:11px;margin-bottom:4px;">⏱️ Controle Furtivo Anti-Bloqueio (Com Variação Humana)</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
            <div>
              <div class="koch-lbl">Tempo Base entre Págs (ms)</div>
              <input type="number" id="cfg-delayMs" value="2200" min="500" max="20000" step="100">
            </div>
            <div>
              <div class="koch-lbl">Tempo ao Trocar Categoria (ms)</div>
              <input type="number" id="cfg-delayTrocaRotaMs" value="3800" min="1000" max="30000" step="200">
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:5px;margin-top:6px;">
            <div>
              <div class="koch-lbl">Espera 429 (ms)</div>
              <input type="number" id="cfg-backoffMs" value="12000" min="3000" max="90000" step="1000">
            </div>
            <div>
              <div class="koch-lbl">Tentativas</div>
              <input type="number" id="cfg-maxRetries" value="5" min="1" max="15">
            </div>
            <div>
              <div class="koch-lbl">Salvar +Novos</div>
              <input type="number" id="cfg-salvarAoAdicionar" value="1" min="1" max="500" step="1">
            </div>
            <div>
              <div class="koch-lbl">Salvar Atualiz.</div>
              <input type="number" id="cfg-salvarAoAtualizar" value="50" min="1" max="1000" step="10">
            </div>
          </div>
          <div class="koch-row" style="margin-top:6px;">
            <span class="koch-lbl">Itens por Página na API:</span>
            <select id="cfg-size" style="width:185px;">
              <option value="12" selected>12 itens por lote (Padrão Oficial Site)</option>
              <option value="24">24 itens por lote (Moderado)</option>
              <option value="36">36 itens por lote (Rápido / Mais Risco)</option>
            </select>
          </div>
        </div>

        <div class="koch-card">
          <div style="font-weight:800;color:#4ade80;font-size:11px;margin-bottom:4px;">🧭 Comportamento Furtivo e Segurança</div>
          <div class="koch-row">
            <label class="koch-lbl" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="cfg-navegarVisualSPA">
              <span>Navegar/rolar visualmente na tela (Desmarcado = Silencioso sem duplicar reqs)</span>
            </label>
          </div>
          <div class="koch-row">
            <label class="koch-lbl" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="cfg-pararNoLocalExato" checked>
              <span>Parar no local exato se pedir Token/429 e retomar dali</span>
            </label>
          </div>
          <div class="koch-row">
            <label class="koch-lbl" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="cfg-autoDescobrirNovas" checked>
              <span>Incluir subcategorias extras se existirem no menu do site</span>
            </label>
          </div>
          <div class="koch-row">
            <label class="koch-lbl" style="display:flex;align-items:center;gap:6px;cursor:pointer;">
              <input type="checkbox" id="cfg-repescagemGlobalFinal">
              <span>Repescagem final global (opcional)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- ABA 4: PAINEL DE LOGS -->
      <div id="koch-view-logs" style="display:none;padding:8px;flex-direction:column;gap:6px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px;flex-wrap:wrap;">
          <div style="display:flex;gap:3px;">
            <button data-logfilter="TODOS" class="koch-log-filter" style="background:#334155;color:#fff;border:none;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:700;">Todos</button>
            <button data-logfilter="INESPERADO" class="koch-log-filter" style="background:#450a0a;color:#fca5a5;border:1px solid #7f1d1d;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:700;">Alertas (<span id="koch-log-err">0</span>)</button>
            <button data-logfilter="ESPERADO" class="koch-log-filter" style="background:#422006;color:#fde047;border:1px solid #713f12;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:700;">Avisos (<span id="koch-log-exp">0</span>)</button>
          </div>
          <div style="display:flex;gap:3px;">
            <button id="koch-btn-copy-logs" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:4px;padding:3px 6px;font-size:10px;font-weight:700;">Copiar</button>
            <button id="koch-btn-clear-logs" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:4px;padding:3px 6px;font-size:10px;">Limpar</button>
          </div>
        </div>

        <input type="text" id="koch-log-search" placeholder="🔍 Filtrar logs em tempo real (ex: erro, token, preço)..." style="background:#020617;color:#f8fafc;border:1px solid #334155;border-radius:4px;padding:3px 6px;font-size:10px;width:100%;outline:none;">

        <div id="koch-log-list" class="koch-scroll" style="background:#020617;border:1px solid #1e293b;border-radius:6px;padding:6px;height:290px;overflow-y:auto;font-family:monospace;font-size:10px;display:flex;flex-direction:column;gap:4px;">
          <div style="color:#64748b;">Nenhum evento registrado ainda.</div>
        </div>
      </div>

      <!-- RODAPÉ DE CONTROLES FIXO -->
      <div style="background:#020617;padding:8px 10px;border-top:1px solid #334155;display:grid;grid-template-columns:1.35fr 1fr 1fr 0.9fr;gap:5px;">
        <button id="koch-btn-start" style="background:#22c55e;color:#020617;border:none;border-radius:5px;padding:7px 4px;font-size:11px;font-weight:900;">
          ▶ Iniciar Fila
        </button>
        <button id="koch-btn-pause" disabled style="background:#1e293b;color:#64748b;border:1px solid #334155;border-radius:5px;padding:7px 4px;font-size:11px;font-weight:700;">
          ⏸ Pausar
        </button>
        <button id="koch-btn-save" style="background:#eab308;color:#020617;border:none;border-radius:5px;padding:7px 4px;font-size:11px;font-weight:800;">
          💾 Salvar
        </button>
        <button id="koch-btn-cancel" disabled style="background:#1e293b;color:#64748b;border:1px solid #334155;border-radius:5px;padding:7px 4px;font-size:11px;font-weight:700;">
          ⏹ Parar
        </button>
      </div>

    </div>
  `;
  document.body.appendChild(balao);

  // Referências de DOM
  const elBody = document.getElementById("koch-body-area");
  const elDot = document.getElementById("koch-dot");
  const elCount = document.getElementById("koch-badge-count");
  const elNew = document.getElementById("koch-badge-new");
  const elEtapa = document.getElementById("koch-etapa-atual");
  const elUrlAtual = document.getElementById("koch-url-atual");
  const elStatus = document.getElementById("koch-status-msg");
  const elBarra = document.getElementById("koch-progress-bar");
  const elItems = document.getElementById("koch-live-items");
  const elStatCats = document.getElementById("koch-stat-cats");
  const elStatCheckpoint = document.getElementById("koch-stat-checkpoint");
  const elStatReqs = document.getElementById("koch-stat-reqs");
  const elAlertaParada = document.getElementById("koch-alerta-parada");
  const elAlertaTitulo = document.getElementById("koch-alerta-titulo");
  const elAlertaDesc = document.getElementById("koch-alerta-desc");
  const elListaRotas = document.getElementById("koch-lista-rotas");
  const elFilaTotal = document.getElementById("koch-fila-total");
  const elLogList = document.getElementById("koch-log-list");
  const elLogTotal = document.getElementById("koch-log-total");
  const elLogErr = document.getElementById("koch-log-err");
  const elLogExp = document.getElementById("koch-log-exp");

  const btnStart = document.getElementById("koch-btn-start");
  const btnPause = document.getElementById("koch-btn-pause");
  const btnSave = document.getElementById("koch-btn-save");
  const btnCancel = document.getElementById("koch-btn-cancel");
  const btnMin = document.getElementById("koch-btn-min");
  const btnClose = document.getElementById("koch-btn-close");

  const tabFila = document.getElementById("koch-tab-fila");
  const tabLive = document.getElementById("koch-tab-live");
  const tabConfig = document.getElementById("koch-tab-config");
  const tabLogs = document.getElementById("koch-tab-logs");

  const viewFila = document.getElementById("koch-view-fila");
  const viewLive = document.getElementById("koch-view-live");
  const viewConfig = document.getElementById("koch-view-config");
  const viewLogs = document.getElementById("koch-view-logs");

  // Troca de abas
  const mudarAba = (aba) => {
    estado.abaAtual = aba;
    viewFila.style.display = aba === "fila" ? "flex" : "none";
    viewLive.style.display = aba === "live" ? "flex" : "none";
    viewConfig.style.display = aba === "config" ? "block" : "none";
    viewLogs.style.display = aba === "logs" ? "flex" : "none";

    const abas = [
      { id: "fila", btn: tabFila },
      { id: "live", btn: tabLive },
      { id: "config", btn: tabConfig },
      { id: "logs", btn: tabLogs }
    ];
    abas.forEach(a => {
      const ativo = a.id === aba;
      a.btn.style.background = ativo ? "#1e293b" : "transparent";
      a.btn.style.color = ativo ? "#fff" : "#94a3b8";
      a.btn.style.borderBottomColor = ativo ? "#22c55e" : "transparent";
    });

    if (aba === "fila") renderizarListaRotas();
    if (aba === "logs") renderizarLogs();
  };

  tabFila.onclick = () => mudarAba("fila");
  tabLive.onclick = () => mudarAba("live");
  tabConfig.onclick = () => mudarAba("config");
  tabLogs.onclick = () => mudarAba("logs");

  // Renderiza a fila sequencial de categorias e permite clicar para escolher de onde iniciar
  const renderizarListaRotas = () => {
    elFilaTotal.innerText = rotasAtivas.length;
    elListaRotas.innerHTML = rotasAtivas.map((r, idx) => {
      const prog = estado.progressoPorRota[idx] || { status: "pendente", lidos: 0, pags: 0 };
      const ehAtual = idx === estado.indiceRotaAtual;
      let badge = `<span style="color:#64748b;">⏳ Fila</span>`;
      let bg = ehAtual ? "#1e293b" : "transparent";
      let bordaEsq = ehAtual ? "3px solid #eab308" : "3px solid transparent";

      if (prog.status === "concluido") {
        badge = `<span style="color:#4ade80;font-weight:700;">✅ ${prog.lidos} itens (${prog.pags}p)</span>`;
        bordaEsq = "3px solid #22c55e";
      } else if (prog.status === "rodando" || (ehAtual && estado.rodando)) {
        badge = `<span style="color:#fde047;font-weight:800;">🔄 Pág ${estado.paginaAtualNaRota} (${prog.lidos} itens)</span>`;
        bg = "#172554";
        bordaEsq = "3px solid #38bdf8";
      } else if (ehAtual && (estado.offsetFromAtual > 0 || prog.status === "pausado")) {
        badge = `<span style="color:#fb923c;font-weight:700;">⏸ Parado pág ${estado.paginaAtualNaRota}</span>`;
        bordaEsq = "3px solid #f97316";
      }

      return `
        <div class="rota-item" data-rotaidx="${idx}" style="background:${bg};border-left:${bordaEsq};" title="Clique para definir ponto de partida: ${r.url}">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:270px;">
            <span style="color:#64748b;font-family:monospace;">#${idx + 1}</span>
            <strong style="color:${r.tipo === 'depto' ? '#fde047' : '#e2e8f0'};"> ${r.nome}</strong>
          </div>
          <div style="white-space:nowrap;">${badge}</div>
        </div>
      `;
    }).join("");

    elListaRotas.querySelectorAll(".rota-item").forEach(item => {
      item.onclick = () => {
        const novoIdx = Number(item.getAttribute("data-rotaidx")) || 0;
        estado.indiceRotaAtual = novoIdx;
        estado.offsetFromAtual = 0;
        estado.paginaAtualNaRota = 1;
        salvarCheckpointLocal();
        renderizarListaRotas();
        atualizarUI(`🎯 Ponto de partida: #${novoIdx + 1} ${rotasAtivas[novoIdx]?.nome}`, `Pronto para iniciar/retomar do link #${novoIdx + 1}.`);
        registrarLog("OK", "Fila", `Ponto de partida ajustado manualmente para #${novoIdx + 1}: ${rotasAtivas[novoIdx]?.nome}`);
      };
    });
  };

  // Editor de URLs personalizadas
  const boxEditorUrls = document.getElementById("koch-editor-urls-box");
  const txtUrls = document.getElementById("koch-textarea-urls");

  document.getElementById("koch-btn-edit-urls").onclick = () => {
    const aberto = boxEditorUrls.style.display === "flex";
    if (aberto) {
      boxEditorUrls.style.display = "none";
      elListaRotas.style.display = "block";
    } else {
      txtUrls.value = rotasAtivas.map(r => r.url).join("\n");
      elListaRotas.style.display = "none";
      boxEditorUrls.style.display = "flex";
    }
  };

  document.getElementById("koch-btn-restore-default-urls").onclick = () => {
    txtUrls.value = ROTAS_PADRAO_SEQUENCIAIS.map(r => r.url).join("\n");
  };

  document.getElementById("koch-btn-save-urls").onclick = () => {
    const matches = txtUrls.value.match(/https?:\/\/[^\s)\]]+/g) || [];
    const novas = [];
    const vistos = new Set();

    matches.forEach(rawUrl => {
      if (rawUrl.includes("google.com/search?q=")) {
        try {
          const uObj = new URL(rawUrl);
          if (uObj.searchParams.get("q")) rawUrl = uObj.searchParams.get("q");
        } catch (e) {}
      }
      const pNorm = normalizarPathUrl(rawUrl).toLowerCase();
      if (!pNorm || vistos.has(pNorm)) return;
      vistos.add(pNorm);

      if (mapaLookupRotas.has(pNorm)) {
        novas.push({ ...mapaLookupRotas.get(pNorm) });
      } else {
        const partes = pNorm.split("/").filter(Boolean);
        const ultimo = (partes[partes.length - 1] || "Link").replace(/-/g, " ");
        novas.push({
          url: rawUrl,
          pathReal: pNorm,
          tipo: pNorm.includes("/promocoes") ? "promocoes" : (partes.length >= 3 ? "sub" : "depto"),
          id: null,
          depto: partes[1] || "Geral",
          nome: `Personalizado > ${ultimo}`
        });
      }
    });

    if (novas.length > 0) {
      rotasAtivas = novas;
      limparCheckpointLocal();
      boxEditorUrls.style.display = "none";
      elListaRotas.style.display = "block";
      renderizarListaRotas();
      registrarLog("OK", "Fila", `Sequência personalizada atualizada com ${rotasAtivas.length} links.`);
    }
  };

  document.getElementById("koch-btn-reset-checkpoint").onclick = () => {
    limparCheckpointLocal();
    btnStart.innerText = "▶ Iniciar Fila";
    renderizarListaRotas();
    atualizarUI("↺ Fila reiniciada do #1", "Checkpoint zerado. Pronto para começar do 1º link.", 0);
    registrarLog("OK", "Checkpoint", "Progresso de fila resetado para o link #1.");
  };

  const btnCamadaRadar = document.getElementById("koch-camada-btn-radar");
  const btnCamadaTurno = document.getElementById("koch-camada-btn-turno");
  const btnCamadaCompleta = document.getElementById("koch-camada-btn-completa");

  const atualizarBotoesCamadaUI = (ativa) => {
    if (btnCamadaRadar) {
      btnCamadaRadar.style.background = ativa === "RADAR" ? "#854d0e" : "#1e293b";
      btnCamadaRadar.style.color = ativa === "RADAR" ? "#fef08a" : "#fde047";
    }
    if (btnCamadaTurno) {
      btnCamadaTurno.style.background = ativa === "2A" ? "#064e3b" : "#1e293b";
      btnCamadaTurno.style.color = ativa === "2A" ? "#6ee7b7" : "#94a3b8";
    }
    if (btnCamadaCompleta) {
      btnCamadaCompleta.style.background = ativa === "COMPLETA" ? "#1e3a8a" : "#1e293b";
      btnCamadaCompleta.style.color = ativa === "COMPLETA" ? "#93c5fd" : "#94a3b8";
    }
  };

  if (btnCamadaRadar) btnCamadaRadar.onclick = () => {
    config.modoFila = "RADAR";
    rotasAtivas = obterRotasPorModo("RADAR");
    limparCheckpointLocal();
    renderizarListaRotas();
    atualizarBotoesCamadaUI("RADAR");
    btnStart.innerText = `▶ Iniciar Radar (${rotasAtivas.length} links)`;
    atualizarUI("⚡ Camada Radar", `Fila com ${rotasAtivas.length} rotas de ofertas relâmpago (~1-2 min).`, 0);
    registrarLog("OK", "Camada", `Modo alternado para Camada 1: Radar de Ofertas (${rotasAtivas.length} rotas).`);
  };

  if (btnCamadaTurno) btnCamadaTurno.onclick = () => {
    config.modoFila = "2A";
    rotasAtivas = obterRotasPorModo("2A");
    limparCheckpointLocal();
    renderizarListaRotas();
    atualizarBotoesCamadaUI("2A");
    btnStart.innerText = `▶ Iniciar Turno (${rotasAtivas.length} links)`;
    atualizarUI("⚖️ Camada Turno 2A", `Fila com ${rotasAtivas.length} subcategorias sem duplicações.`, 0);
    registrarLog("OK", "Camada", `Modo alternado para Camada 2: Varredura de Turno (${rotasAtivas.length} rotas).`);
  };

  if (btnCamadaCompleta) btnCamadaCompleta.onclick = () => {
    config.modoFila = "COMPLETA";
    rotasAtivas = obterRotasPorModo("COMPLETA");
    limparCheckpointLocal();
    renderizarListaRotas();
    atualizarBotoesCamadaUI("COMPLETA");
    btnStart.innerText = `▶ Iniciar Geral (${rotasAtivas.length} links)`;
    atualizarUI("🌙 Camada Noturna", `Fila com todas as ${rotasAtivas.length} rotas do catálogo 100%.`, 0);
    registrarLog("OK", "Camada", `Modo alternado para Camada 3: Varredura Geral 100% (${rotasAtivas.length} rotas).`);
  };

  // Sistema de Logs
  const registrarLog = (tipo, contexto, mensagem, detalhe = "") => {
    const hora = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    estado.logs.unshift({ hora, tipo, contexto, mensagem, detalhe });
    if (estado.logs.length > 400) estado.logs.pop();

    if (estado.contagemLogs[tipo] !== undefined) estado.contagemLogs[tipo]++;
    elLogTotal.innerText = estado.logs.length;
    elLogErr.innerText = estado.contagemLogs.INESPERADO;
    elLogExp.innerText = estado.contagemLogs.ESPERADO;

    if (estado.abaAtual === "logs") renderizarLogs();
  };

  let filtroLogTextoRobo = "";
  const inpSearchLogRobo = document.getElementById("koch-log-search");
  if (inpSearchLogRobo) {
    inpSearchLogRobo.oninput = (e) => {
      filtroLogTextoRobo = String(e.target.value || "").trim().toLowerCase();
      renderizarLogs();
    };
  }

  const renderizarLogs = () => {
    let filtrados = estado.filtroLog === "TODOS"
      ? estado.logs
      : estado.logs.filter(l => l.tipo === estado.filtroLog);

    if (filtroLogTextoRobo) {
      filtrados = filtrados.filter(l => `${l.hora} ${l.tipo} ${l.contexto} ${l.mensagem} ${l.detalhe}`.toLowerCase().includes(filtroLogTextoRobo));
    }

    if (filtrados.length === 0) {
      elLogList.innerHTML = `<div style="color:#64748b;">Nenhum log para o filtro [${estado.filtroLog}${filtroLogTextoRobo ? ` • "${filtroLogTextoRobo}"` : ""}].</div>`;
      return;
    }

    elLogList.innerHTML = filtrados.slice(0, 180).map(l => {
      let cor = "#86efac";
      let bg = "#052e16";
      if (l.tipo === "ESPERADO") { cor = "#fde047"; bg = "#422006"; }
      else if (l.tipo === "INESPERADO") { cor = "#fca5a5"; bg = "#450a0a"; }

      return `
        <div style="border-bottom:1px solid #1e293b;padding-bottom:3px;word-break:break-word;">
          <span style="color:#64748b;">[${l.hora}]</span>
          <span style="background:${bg};color:${cor};padding:0 4px;border-radius:3px;font-weight:700;">${l.tipo}</span>
          <strong style="color:#e2e8f0;"> ${l.contexto}:</strong>
          <span style="color:#cbd5e1;"> ${l.mensagem}</span>
          ${l.detalhe ? `<div style="color:#fde047;padding-left:10px;font-size:9px;background:#090d16;margin-top:2px;padding:2px 4px;border-radius:3px;">↳ ${l.detalhe}</div>` : ""}
        </div>
      `;
    }).join("");
  };

  document.querySelectorAll(".koch-log-filter").forEach(btn => {
    btn.onclick = () => {
      estado.filtroLog = btn.getAttribute("data-logfilter");
      renderizarLogs();
    };
  });

  document.getElementById("koch-btn-copy-logs").onclick = () => {
    const txt = estado.logs.map(l => `[${l.hora}] [${l.tipo}] ${l.contexto}: ${l.mensagem} ${l.detalhe ? `(${l.detalhe})` : ""}`).join("\n");
    navigator.clipboard.writeText(txt || "Sem logs.");
    registrarLog("OK", "Logs", "Logs copiados para a área de transferência.");
  };

  document.getElementById("koch-btn-clear-logs").onclick = () => {
    estado.logs = [];
    estado.contagemLogs = { ESPERADO: 0, INESPERADO: 0, OK: 0 };
    elLogTotal.innerText = "0";
    elLogErr.innerText = "0";
    elLogExp.innerText = "0";
    renderizarLogs();
  };

  // Lê configurações da UI em tempo real
  const lerConfigDaUI = () => {
    config.delayMs = Math.max(500, Number(document.getElementById("cfg-delayMs")?.value) || 2200);
    config.delayTrocaRotaMs = Math.max(1000, Number(document.getElementById("cfg-delayTrocaRotaMs")?.value) || 3800);
    config.backoffMs = Math.max(3000, Number(document.getElementById("cfg-backoffMs")?.value) || 12000);
    config.maxRetries = Math.max(1, Number(document.getElementById("cfg-maxRetries")?.value) || 5);
    config.salvarAoAdicionar = Math.max(1, Number(document.getElementById("cfg-salvarAoAdicionar")?.value) || 1);
    config.salvarAoAtualizar = Math.max(1, Number(document.getElementById("cfg-salvarAoAtualizar")?.value) || 50);
    config.size = Number(document.getElementById("cfg-size")?.value) || 12;
    config.navegarVisualSPA = Boolean(document.getElementById("cfg-navegarVisualSPA")?.checked);
    config.pararNoLocalExato = Boolean(document.getElementById("cfg-pararNoLocalExato")?.checked);
    config.autoDescobrirNovas = Boolean(document.getElementById("cfg-autoDescobrirNovas")?.checked);
    config.repescagemGlobalFinal = Boolean(document.getElementById("cfg-repescagemGlobalFinal")?.checked);
  };

  balao.querySelectorAll("input, select").forEach(inp => {
    inp.onchange = lerConfigDaUI;
  });

  // Minimizar / Fechar
  const alternarMinimizar = () => {
    estado.minimizado = !estado.minimizado;
    elBody.style.display = estado.minimizado ? "none" : "flex";
    balao.style.width = estado.minimizado ? "290px" : "435px";
    btnMin.innerText = estado.minimizado ? "▢" : "_";
  };
  btnMin.onclick = (e) => { e.stopPropagation(); alternarMinimizar(); };
  document.getElementById("koch-header-bar").onclick = (e) => {
    if (e.target === btnMin || e.target === btnClose) return;
    if (estado.minimizado) alternarMinimizar();
  };

  btnClose.onclick = (e) => {
    e.stopPropagation();
    estado.cancelado = true;
    estado.pausado = false;
    salvarCheckpointLocal();
    balao.remove();
  };

  // Mostra ou oculta o banner de parada protetora (Token / Rate Limit)
  const exibirAlertaParada = (visivel, titulo = "", desc = "") => {
    if (!elAlertaParada) return;
    elAlertaParada.style.display = visivel ? "block" : "none";
    if (titulo) elAlertaTitulo.innerText = titulo;
    if (desc) elAlertaDesc.innerText = desc;
  };

  // Atualiza contadores e status na tela
  const atualizarUI = (etapa, msg, pct, ultimoItemStr, urlMostrada) => {
    if (etapa && elEtapa) elEtapa.innerText = etapa;
    if (urlMostrada && elUrlAtual) elUrlAtual.innerText = urlMostrada;
    if (msg && elStatus) elStatus.innerText = msg;
    if (pct !== undefined && elBarra) elBarra.style.width = Math.min(100, Math.max(1, pct)) + "%";
    elCount.innerText = `${mapaProdutos.size} itens`;
    elNew.innerText = `+${estado.novosNaSessao} novos`;
    elStatCats.innerText = `${Math.min(estado.indiceRotaAtual + 1, rotasAtivas.length)} / ${rotasAtivas.length}`;
    elStatCheckpoint.innerText = `Pág ${estado.paginaAtualNaRota} (off ${estado.offsetFromAtual})`;
    elStatReqs.innerText = `${estado.requisicoesFeitas}`;

    if (ultimoItemStr && elItems) {
      estado.ultimosNomes.unshift(ultimoItemStr);
      if (estado.ultimosNomes.length > 5) estado.ultimosNomes.pop();
      elItems.innerHTML = estado.ultimosNomes.map((txt, idx) => `
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${idx === 0 ? '#4ade80' : '#94a3b8'};font-weight:${idx === 0 ? '700' : '400'};">
          ✓ ${txt}
        </div>
      `).join("");
    }
  };

  // Processador de produtos retornados pela API OSuper (Preserva histórico de preços + Categorias exatas + Detecta atualizações)
  let novosSemSalvar = 0;
  const dataHojeISO = new Date().toISOString().slice(0, 10);

  const processarHits = (hits, rotaContexto = null) => {
    if (!Array.isArray(hits) || hits.length === 0) return { ultimoTexto: "", novosNesteLote: 0, precosNesteLote: 0 };
    let ultimoTexto = "";
    let novosNesteLote = 0;
    let precosNesteLote = 0;
    const catRotaNome = rotaContexto?.nome || "Geral";
    const horaStr = new Date().toLocaleTimeString("pt-BR", { hour12: false });

    for (let i = 0; i < hits.length; i++) {
      const item = hits[i];
      if (!item || !item.id) continue;
      estado.totalLidosNaSessao++;

      const existente = mapaProdutos.get(item.id);

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

      const precosCandidatos = [precoClube, precoPromo, precoNormal].filter(x => x > 0);
      const precoFinal = precosCandidatos.length > 0 ? Math.min(...precosCandidatos) : (precoPromo || precoNormal);

      // Proteção contra preço zerado acidental da API: preserva preço anterior do Firebase se existir
      const precoSeguro = precoFinal > 0 ? precoFinal : Number(existente?.preco || 0);
      const precoOrigSeguro = precoNormal > precoSeguro ? precoNormal : Number(existente?.precoOriginal || precoSeguro);

      // Reúne categorias da API + categorias da rota atual + categorias anteriores do produto
      const setCats = new Set();
      if (existente && Array.isArray(existente.categorias)) {
        existente.categorias.forEach(c => { if (typeof c === "string" && c.trim()) setCats.add(c.trim()); });
      }
      if (Array.isArray(item.categories)) {
        item.categories.forEach(c => {
          if (typeof c === "string" && c.trim()) setCats.add(c.trim());
          else if (c && typeof c === "object" && c.name) setCats.add(String(c.name).trim());
        });
      }
      if (item.level1Category?.name) setCats.add(String(item.level1Category.name).trim());
      if (item.level2Category?.name) setCats.add(String(item.level2Category.name).trim());
      if (item.level2Category?.parent?.name) setCats.add(String(item.level2Category.parent.name).trim());
      if (rotaContexto) {
        if (rotaContexto.depto && rotaContexto.depto !== "Página Inicial" && rotaContexto.depto !== "Categorias") {
          setCats.add(rotaContexto.depto);
        }
        if (rotaContexto.nome) {
          setCats.add(rotaContexto.nome);
        }
      }

      // Imagem segura (string direta ou objeto thumborized)
      const imgStr = typeof item.image === "string"
        ? item.image
        : (item.image?.thumborized || item.image?.url || existente?.imagem || "");

      // Marca e nome seguros
      const marcaStr = String(item.brandName || item.brand?.name || existente?.marca || "GENÉRICO").trim();
      const nomeLimpo = String(item.name || existente?.nome || "Produto sem nome").trim();
      const estoqueNovo = item.quantity?.inStock ?? existente?.estoque ?? 0;

      // Histórico inteligente: nunca salva 2 preços iguais consecutivos, e no mesmo dia mantém apenas o mais novo
      const brutoHist = { ...(existente?.historicoPrecos || {}) };
      if (precoSeguro > 0) {
        brutoHist[dataHojeISO] = Number(precoSeguro.toFixed(2));
      }
      const datasHist = Object.keys(brutoHist).sort((a, b) => a.localeCompare(b));
      const historico = {};
      let ultimoValHist = null;
      for (let dIdx = 0; dIdx < datasHist.length; dIdx++) {
        const dtKey = datasHist[dIdx];
        const vNum = Number(brutoHist[dtKey]);
        if (!vNum || vNum <= 0) continue;
        const vArr = Number(vNum.toFixed(2));
        if (ultimoValHist === null || Math.abs(vArr - ultimoValHist) >= 0.01) {
          historico[dtKey] = vArr;
          ultimoValHist = vArr;
        }
      }

      const emPromo = Boolean(item.pricing?.promotion || (precoOrigSeguro > precoSeguro && precoSeguro > 0));
      const descPct = item.pricing?.discount || (precoOrigSeguro > precoSeguro && precoOrigSeguro > 0 ? Math.round(((precoOrigSeguro - precoSeguro) / precoOrigSeguro) * 100) : 0);

      // Distingue produto NOVO de produto ATUALIZADO (mudança de preço ou estoque)
      if (!existente) {
        novosSemSalvar++;
        estado.novosNaSessao++;
        estado.novosDesdeUltimoSave++;
        novosNesteLote++;
        estado.ultimosNovos.unshift({
          id: item.id,
          nome: nomeLimpo,
          marca: marcaStr,
          preco: precoSeguro,
          precoOriginal: precoOrigSeguro,
          desconto: descPct,
          estoque: estoqueNovo,
          imagem: imgStr,
          categoria: catRotaNome,
          hora: horaStr
        });
        if (estado.ultimosNovos.length > 50) estado.ultimosNovos.pop();
      } else {
        const precoAntigo = Number(existente.preco || 0);
        const precoOrigAntigo = Number(existente.precoOriginal || precoAntigo);
        const estoqueAntigo = Number(existente.estoque ?? 0);
        const mudouPreco = precoSeguro > 0 && Math.abs(precoAntigo - precoSeguro) >= 0.01;
        const mudouPrecoOrig = Math.abs(precoOrigAntigo - precoOrigSeguro) >= 0.01;
        const mudouEstoque = estoqueAntigo !== Number(estoqueNovo);

        if (mudouPreco) {
          precosNesteLote++;
          estado.precosAlteradosNaSessao++;
          estado.atualizadosNaSessao++;
          estado.atualizadosDesdeUltimoSave++;
          const diferenca = Number((precoSeguro - precoAntigo).toFixed(2));
          const pctMudanca = precoAntigo > 0 ? Math.round(((precoSeguro - precoAntigo) / precoAntigo) * 100) : 0;
          estado.ultimosPrecosAlterados.unshift({
            id: item.id,
            nome: nomeLimpo,
            marca: marcaStr,
            precoAntigo,
            precoNovo: precoSeguro,
            diferenca,
            pctMudanca,
            estoque: estoqueNovo,
            imagem: imgStr,
            categoria: catRotaNome,
            hora: horaStr
          });
          if (estado.ultimosPrecosAlterados.length > 60) estado.ultimosPrecosAlterados.pop();
        } else if (mudouEstoque || mudouPrecoOrig) {
          estado.estoquesAlteradosNaSessao++;
          estado.atualizadosNaSessao++;
          estado.atualizadosDesdeUltimoSave++;
          estado.ultimosEstoquesAlterados.unshift({
            id: item.id,
            nome: nomeLimpo,
            marca: marcaStr,
            estoqueAntigo,
            estoqueNovo,
            preco: precoSeguro,
            categoria: catRotaNome,
            hora: horaStr
          });
          if (estado.ultimosEstoquesAlterados.length > 40) estado.ultimosEstoquesAlterados.pop();
        }
      }

      const prodObj = {
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
        mercado,
        lojaId: lojaIdPadrao,
        historicoPrecos: historico
      };

      mapaProdutos.set(item.id, prodObj);
      ultimoTexto = `${prodObj.nome} (R$ ${Number(prodObj.preco).toFixed(2).replace('.', ',')})`;
    }
    elNew.innerText = `+${estado.novosNaSessao} • 🔄${estado.precosAlteradosNaSessao}`;
    return { ultimoTexto, novosNesteLote, precosNesteLote };
  };

  // =======================================================================
  // INTERCEPTADOR DUPLO DE REDE (FETCH + XHR)
  // Captura automaticamente o Token e também coleta qualquer produto que
  // o próprio site do SuperKoch carregue durante a rolagem da página!
  // =======================================================================
  const extrairParamsUrl = (urlStr) => {
    try {
      if (!urlStr || !urlStr.includes("sense.osuper.com.br")) return;
      const u = new URL(urlStr);
      if (u.pathname.includes("/v2/search")) {
        estado.storePath = u.pathname;
      }
      if (u.searchParams.has("customerId")) estado.customerId = u.searchParams.get("customerId");
      if (u.searchParams.has("isEmployee")) estado.isEmployee = u.searchParams.get("isEmployee");
      const mHide = urlStr.match(/hidePersonas=([^&]*)/);
      if (mHide) estado.hidePersonas = mHide[1];
    } catch (e) {}
  };

  const sincronizarToken = (tk) => {
    if (!tk || typeof tk !== "string" || estado.token === tk) return;
    estado.token = tk;
    const p = tk.split(".");
    if (p.length >= 5 && p[0] === "v1") {
      if (p[2] && p[2] !== "0") {
        estado.customerId = p[2];
        estado.isEmployee = p[4] === "1" ? "true" : "false";
      } else {
        estado.customerId = "";
        estado.isEmployee = "";
      }
    }
    if (estado.aguardandoToken) {
      estado.aguardandoToken = false;
      exibirAlertaParada(false);
    }
    registrarLog("OK", "Token", `Token ativo sincronizado (Loja ${estado.storeId} / Cliente ${estado.customerId || "Visitante"}).`);
  };

  const instalarMonitorDeRede = () => {
    if (window.__kochHookV7Ativo) return;
    window.__kochHookV7Ativo = true;

    const origFetch = window.fetch;
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
    const origSend = XMLHttpRequest.prototype.send;

    window.fetch = async function(...args) {
      let url = "";
      try {
        url = typeof args[0] === "string" ? args[0] : (args[0]?.url || "");
        extrairParamsUrl(url);
        const h = args[1]?.headers || {};
        const tk = (h.get ? (h.get("x-osuper-search-token") || h.get("x-osuper-identity-token")) : null) || h["x-osuper-search-token"] || h["x-osuper-identity-token"];
        if (tk) sincronizarToken(tk);
      } catch (e) {}

      const resp = await origFetch.apply(this, args);
      try {
        if (url && (url.includes("sense.osuper.com.br") || url.includes("/storefront/graphql"))) {
          const clone = resp.clone();
          clone.json().then(dados => {
            if (dados?.data?.customerViewer?.searchIdentityToken) {
              sincronizarToken(dados.data.customerViewer.searchIdentityToken);
            }
            if (Array.isArray(dados?.hits) && dados.hits.length > 0) {
              const rotaAtual = rotasAtivas[estado.indiceRotaAtual] || null;
              processarHits(dados.hits, rotaAtual);
              elCount.innerText = `${mapaProdutos.size} itens`;
              elNew.innerText = `+${estado.novosNaSessao} novos`;
            }
          }).catch(() => {});
        }
      } catch (e) {}
      return resp;
    };

    XMLHttpRequest.prototype.open = function(method, url) {
      this.__kochUrl = url;
      extrairParamsUrl(url);
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      const nLower = String(name || "").toLowerCase();
      if ((nLower === "x-osuper-identity-token" || nLower === "x-osuper-search-token") && value) {
        sincronizarToken(value);
      }
      return origSetHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function() {
      this.addEventListener("load", function() {
        try {
          if (this.__kochUrl && (this.__kochUrl.includes("sense.osuper.com.br") || this.__kochUrl.includes("/storefront/graphql"))) {
            const dados = JSON.parse(this.responseText);
            if (dados?.data?.customerViewer?.searchIdentityToken) {
              sincronizarToken(dados.data.customerViewer.searchIdentityToken);
            }
            if (Array.isArray(dados?.hits) && dados.hits.length > 0) {
              const rotaAtual = rotasAtivas[estado.indiceRotaAtual] || null;
              processarHits(dados.hits, rotaAtual);
              elCount.innerText = `${mapaProdutos.size} itens`;
              elNew.innerText = `+${estado.novosNaSessao} novos`;
            }
          }
        } catch (e) {}
      });
      return origSend.apply(this, arguments);
    };
  };
  instalarMonitorDeRede();

  // Tenta renovar o token diretamente via HTML inicial ou GraphQL oficial
  const tentarRenovarTokenViaGraphQL = async () => {
    try {
      if (isFort) {
        const tkApp = window.INITIAL_STATE?.app?.searchEngineToken;
        if (tkApp) {
          sincronizarToken(tkApp);
          return tkApp;
        }
      }
      const initTk = window.INITIAL_STATE?.auth?.searchIdentityToken;
      if (initTk) {
        sincronizarToken(initTk);
        return initTk;
      }
      const gqlUrl = window.GRAPHQL_URL || "https://api.superkoch.com.br:443/storefront/graphql";
      const headers = {
        "Content-Type": "application/json",
        "accept": "*/*",
        "Versioning": "Apollo Client Frontend Production SP72"
      };
      if (window.SESSION_ID) headers["sessionId"] = String(window.SESSION_ID);
      if (window.__BUILD_VERSION__) headers["x-client-version"] = String(window.__BUILD_VERSION__);

      const resp = await fetch(gqlUrl, {
        method: "POST",
        credentials: "include",
        headers,
        body: JSON.stringify({
          operationName: "SearchIdentityTokenQuery",
          variables: {},
          query: "query SearchIdentityTokenQuery { customerViewer { id searchIdentityToken } }"
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        const tk = json?.data?.customerViewer?.searchIdentityToken;
        if (tk) {
          sincronizarToken(tk);
          return tk;
        }
      }
    } catch (e) {}
    return null;
  };

  // Função auxiliar para ler e mesclar produtos do Firebase com segurança (nunca apaga itens existentes)
  const carregarEMesclarDoFirebase = async () => {
    try {
      const rFb = await fetch(comAuth(FIREBASE_ENDPOINT));
      if (rFb.ok) {
        const dFb = await rFb.json();
        if (dFb && Array.isArray(dFb.produtos)) {
          let preservados = 0;
          dFb.produtos.forEach(p => {
            if (p && p.id) {
              if (!mapaProdutos.has(p.id)) {
                mapaProdutos.set(p.id, p);
                preservados++;
              } else {
                // Mescla histórico de preços e categorias anteriores sem perder nada
                const atual = mapaProdutos.get(p.id);
                atual.historicoPrecos = { ...(p.historicoPrecos || {}), ...(atual.historicoPrecos || {}) };
                const catsUnidas = new Set([...(p.categorias || []), ...(atual.categorias || [])]);
                atual.categorias = Array.from(catsUnidas);
                mapaProdutos.set(p.id, atual);
              }
            }
          });
          estado.totalInicialFirebase = Math.max(estado.totalInicialFirebase, dFb.produtos.length);
          estado.leituraFirebaseConcluida = true;
          return dFb.produtos.length;
        } else if (dFb === null) {
          estado.leituraFirebaseConcluida = true;
          return 0;
        }
      }
    } catch (e) {
      registrarLog("INESPERADO", "Firebase", "Falha ao ler catálogo inicial do Firebase.", e.message);
    }
    return -1;
  };

  // Carrega a base existente do Firebase e verifica se há Checkpoint salvo
  (async () => {
    sincronizarApolloStateDaPagina();
    const cp = carregarCheckpointLocal();
    if (cp && typeof cp.indiceRotaAtual === "number" && cp.indiceRotaAtual > 0 && cp.indiceRotaAtual < rotasAtivas.length) {
      estado.indiceRotaAtual = cp.indiceRotaAtual;
      estado.offsetFromAtual = cp.offsetFromAtual || 0;
      estado.paginaAtualNaRota = cp.paginaAtualNaRota || 1;
      estado.progressoPorRota = cp.progressoPorRota || {};
      btnStart.innerText = `▶ Retomar (#${estado.indiceRotaAtual + 1})`;
      registrarLog("OK", "Checkpoint", `Checkpoint anterior encontrado: Link #${estado.indiceRotaAtual + 1} (${rotasAtivas[estado.indiceRotaAtual]?.nome}), pág ${estado.paginaAtualNaRota}.`);
    }
    renderizarListaRotas();

    const lidosFb = await carregarEMesclarDoFirebase();
    if (lidosFb >= 0) {
      atualizarUI(null, `Base do Firebase protegida (${mapaProdutos.size} itens). Pronto para iniciar.`);
      registrarLog("OK", "Firebase", `Catálogo existente carregado e protegido: ${mapaProdutos.size} produtos na memória.`);
    }
  })();

  // Sincronização leve com Painel Mobile / Central do Robô (~2 KB)
  let ultimoEnvioTelemetriaMs = 0;
  const formatarDuracaoSeg = (sTot) => {
    const s = Math.max(0, Math.round(sTot));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const seg = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(seg).padStart(2, "0")}s`;
    if (m > 0) return `${m}m ${String(seg).padStart(2, "0")}s`;
    return `${seg}s`;
  };

  const enviarTelemetriaAoVivo = async (forcar = false, statusOverride = null, msgOverride = null) => {
    const agora = Date.now();
    if (!forcar && agora - ultimoEnvioTelemetriaMs < 2500) return;
    ultimoEnvioTelemetriaMs = agora;

    const rotaAtualObj = rotasAtivas[estado.indiceRotaAtual] || {};
    const rotasRestantes = Math.max(0, rotasAtivas.length - (estado.indiceRotaAtual + 1));
    const pct = Math.min(100, Math.max(1, Math.round(((estado.indiceRotaAtual + 1) / Math.max(1, rotasAtivas.length)) * 100)));
    const statusEnvio = statusOverride || (estado.cancelado ? "CANCELADO_SALVO" : (estado.pausado ? "PAUSADO" : (estado.bloqueioAtivo ? "BLOQUEIO_ESPERA" : (estado.rodando ? "RODANDO" : "PRONTO"))));

    const decorridoSeg = Math.max(1, Math.round((agora - estado.tempoInicioMs) / 1000));
    const pagsRestCat = Math.max(0, (estado.totalPaginasEstimadoRota || 1) - (estado.paginaAtualNaRota || 1));
    const estCatSeg = Math.round(pagsRestCat * ((config.delayMs * 1.25 + 650) / 1000));
    const estTotalSeg = Math.round((rotasRestantes * (config.delayMs * 8 + config.delayTrocaRotaMs)) / 1000 + estCatSeg);

    const deptoNome = rotaAtualObj.depto || "Geral";
    const idxsDepto = [];
    rotasAtivas.forEach((r, idx) => { if (r.depto === deptoNome) idxsDepto.push(idx); });
    const posNoDepto = Math.max(1, idxsDepto.indexOf(estado.indiceRotaAtual) + 1);
    const totNoDepto = idxsDepto.length || 1;

    const payload = {
      idExecucao: estado.idExecucao,
      origem: "Navegador (Robô V7)",
      iniciadoEm: new Date(estado.tempoInicioMs).toISOString(),
      tempoInicioMs: estado.tempoInicioMs,
      atualizadoEm: new Date().toISOString(),
      heartbeatMs: agora,
      status: statusEnvio,
      mensagem: msgOverride || elStatus?.innerText || "Ativo",
      progressoPct: statusEnvio === "CONCLUIDO" ? 100 : pct,
      tempoDecorrido: formatarDuracaoSeg(decorridoSeg),
      tempoEstimadoCategoria: pagsRestCat <= 0 ? "Finalizando categoria..." : `~${formatarDuracaoSeg(estCatSeg)} (faltam ${pagsRestCat} págs)`,
      tempoRestante: statusEnvio === "CONCLUIDO" ? "Concluído!" : `~${formatarDuracaoSeg(estTotalSeg)}`,
      rotaIndiceAtual: estado.indiceRotaAtual + 1,
      rotaTotal: rotasAtivas.length,
      categoriasFaltando: rotasRestantes,
      rotaNomeAtual: rotaAtualObj.nome || "Início",
      rotaUrlAtual: rotaAtualObj.url || "",
      deptoAtualNome: deptoNome,
      subcategoriaPosNoDepto: posNoDepto,
      subcategoriasTotalNoDepto: totNoDepto,
      subcategoriasFaltandoNoDepto: Math.max(0, totNoDepto - posNoDepto),
      paginaAtual: estado.paginaAtualNaRota,
      totalPaginasEstimadoRota: estado.totalPaginasEstimadoRota || 1,
      offsetAtual: estado.offsetFromAtual,
      totalInicialFirebase: estado.totalInicialFirebase,
      totalAtualNoBanco: mapaProdutos.size,
      totalLidosNaSessao: estado.totalLidosNaSessao,
      novosNaSessao: estado.novosNaSessao,
      precosAlteradosNaSessao: estado.precosAlteradosNaSessao,
      estoquesAlteradosNaSessao: estado.estoquesAlteradosNaSessao,
      atualizadosNaSessao: estado.atualizadosNaSessao,
      novosDesdeUltimoSave: estado.novosDesdeUltimoSave,
      atualizadosDesdeUltimoSave: estado.atualizadosDesdeUltimoSave,
      savesRealizados: estado.savesRealizados,
      ultimoSaveEm: estado.ultimoSaveEm,
      ultimoSaveMotivo: estado.ultimoSaveMotivo,
      requisicoesFeitas: estado.requisicoesFeitas,
      configAtiva: {
        delayMs: config.delayMs,
        delayTrocaRotaMs: config.delayTrocaRotaMs,
        salvarAoAdicionar: config.salvarAoAdicionar,
        salvarAoAtualizar: config.salvarAoAtualizar,
        cooldownSaveMs: config.cooldownSaveMs,
        size: config.size
      },
      ultimosNovos: estado.ultimosNovos.slice(0, 40),
      ultimosPrecosAlterados: estado.ultimosPrecosAlterados.slice(0, 50),
      ultimosEstoquesAlterados: estado.ultimosEstoquesAlterados.slice(0, 30),
      ultimosLidos: estado.ultimosNomes.slice(0, 8),
      ultimosLogs: estado.logs.slice(0, 70),
      contagemLogs: estado.contagemLogs
    };

    try {
      await fetch(comAuth(FIREBASE_TELEMETRIA_ENDPOINT), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!isFort) {
        await fetch(comAuth(baseLimpa + "/robo_controle/telemetria.json"), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    } catch (e) {}
  };

  // Gravação no Firebase com TRAVA RÍGIDA ANTI-CORRUPÇÃO / ANTI-ENCOLHIMENTO
  const gravarNoFirebase = async (silencioso = false, motivo = "Auto-Save") => {
    try {
      // Se a leitura inicial do Firebase ainda não tinha concluído, mescla primeiro para NUNCA sobrescrever o banco!
      if (!estado.leituraFirebaseConcluida) {
        await carregarEMesclarDoFirebase();
      }
      const listaFinal = Array.from(mapaProdutos.values());
      if (listaFinal.length === 0) return;

      // Trava Anti-Encolhimento: nunca permite salvar menos produtos do que já existia no Firebase
      if (estado.totalInicialFirebase > 0 && listaFinal.length < estado.totalInicialFirebase) {
        registrarLog("ESPERADO", "Proteção Firebase", `Re-sincronizando com Firebase antes de salvar para garantir que nenhum dos ${estado.totalInicialFirebase} itens antigos seja perdido...`);
        await carregarEMesclarDoFirebase();
      }

      const listaSegura = Array.from(mapaProdutos.values());
      if (estado.totalInicialFirebase > 0 && listaSegura.length < estado.totalInicialFirebase) {
        registrarLog("INESPERADO", "Proteção Firebase", `Gravação abortada por segurança: lista atual (${listaSegura.length}) menor que o banco original (${estado.totalInicialFirebase}).`);
        return;
      }

      const houveMudancas = estado.novosDesdeUltimoSave > 0 || estado.atualizadosDesdeUltimoSave > 0 || motivo.includes("Final") || motivo.includes("Manual");
      if (!houveMudancas) {
        await fetch(comAuth(FIREBASE_ENDPOINT), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            atualizadoEm: new Date().toISOString(),
            "resumoUltimaSessao/motivoUltimoSave": `${motivo} (Sem alterações)`
          })
        }).catch(() => {});
        return;
      }

      if (!silencioso) atualizarUI("☁️ Salvando no Firebase...", `Enviando ${listaSegura.length} produtos com proteção...`);
      const r = await fetch(comAuth(FIREBASE_ENDPOINT), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          atualizadoEm: new Date().toISOString(),
          totalItens: listaSegura.length,
          resumoUltimaSessao: {
            novosAdicionados: estado.novosNaSessao,
            precosAtualizados: estado.precosAlteradosNaSessao,
            estoquesAtualizados: estado.estoquesAlteradosNaSessao,
            motivoUltimoSave: motivo
          },
          produtos: listaSegura
        })
      });
      if (!r.ok) {
        registrarLog("INESPERADO", "Firebase", `Erro HTTP ${r.status} ao gravar no banco.`);
      } else {
        estado.totalInicialFirebase = Math.max(estado.totalInicialFirebase, listaSegura.length);
        estado.savesRealizados++;
        estado.ultimoSaveEm = new Date().toISOString();
        estado.ultimoSaveMotivo = motivo;
        estado.ultimoSaveMs = Date.now();
        const nSalvos = estado.novosDesdeUltimoSave;
        const aSalvos = estado.atualizadosDesdeUltimoSave;
        estado.novosDesdeUltimoSave = 0;
        estado.atualizadosDesdeUltimoSave = 0;
        novosSemSalvar = 0;
        registrarLog("OK", "Firebase", `Salvo #${estado.savesRealizados} (${motivo}): ${listaSegura.length} produtos (+${nSalvos} novos, ${aSalvos} atualizados).`);
        await enviarTelemetriaAoVivo(true);
      }
    } catch (e) {
      registrarLog("INESPERADO", "Firebase", "Exceção ao salvar dados no Firebase.", e.message);
    }
  };

  // Auto-save inteligente: Salva ao adicionar >= 1 novo OU atualizar >= 50 existentes (com respiro para nunca pesar)
  const verificarAutoSaveInteligente = async (contextoCurto, fimDeRota = false) => {
    const atingiuNovos = estado.novosDesdeUltimoSave >= config.salvarAoAdicionar;
    const atingiuAtualizados = estado.atualizadosDesdeUltimoSave >= config.salvarAoAtualizar;
    if (!atingiuNovos && !atingiuAtualizados) return;

    const tempoDesdeSave = Date.now() - estado.ultimoSaveMs;
    if (!fimDeRota && tempoDesdeSave < config.cooldownSaveMs) return;

    const motivo = atingiuNovos
      ? `+${estado.novosDesdeUltimoSave} novo(s) em ${contextoCurto}`
      : `${estado.atualizadosDesdeUltimoSave} atualizados em ${contextoCurto}`;
    await gravarNoFirebase(true, motivo);
  };

  const dormir = (ms) => new Promise(r => setTimeout(r, ms));
  // Pausa com variação humana aleatória (Jitter) para nunca parecer robô na API
  const dormirHumano = (baseMs) => {
    const variacao = Math.floor(Math.random() * Math.max(600, Math.round(baseMs * 0.45)));
    return dormir(baseMs + variacao);
  };

  const aguardarSePausado = async () => {
    while (estado.pausado && !estado.cancelado && !estado.salvarAgora) {
      await dormir(250);
    }
  };

  // =======================================================================
  // NAVEGAÇÃO VISUAL SPA + ROLAGEM DA PÁGINA (SEM RECARREGAR A ABA)
  // =======================================================================
  const navegarParaLinkSPA = async (rota) => {
    if (!config.navegarVisualSPA || !rota || !rota.pathReal) return;
    try {
      const pathAlvo = rota.pathReal;
      if (window.location.pathname !== pathAlvo) {
        // Procura se já existe um link <a> no DOM para acionar o roteador React naturalmente
        const linkDom = document.querySelector(`a[href="${pathAlvo}"], a[href="${rota.url}"]`);
        if (linkDom) {
          linkDom.click();
        } else {
          window.history.pushState({}, "", pathAlvo);
          window.dispatchEvent(new PopStateEvent("popstate"));
        }
      }
      window.scrollTo({ top: 0, behavior: "instant" });
      await dormir(config.delayTrocaRotaMs);
      sincronizarApolloStateDaPagina();
    } catch (e) {}
  };

  // Rola um passo na página para acionar o IntersectionObserver do último card de produto
  const rolarPassoNaPagina = async () => {
    if (!config.navegarVisualSPA) return;
    try {
      const cards = document.querySelectorAll(".item-product-wrapper, .loader-wrapper, [data-id]");
      if (cards.length > 0) {
        const ultimoCard = cards[cards.length - 1];
        ultimoCard.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollBy({ top: 700, behavior: "smooth" });
      }
    } catch (e) {}
  };

  // Rola uma página inteira (usado na Home "/" e em "/categorias" para carregar todos os blocos)
  const rolarPaginaVisualmenteAteOFim = async (rotulo) => {
    if (!config.navegarVisualSPA) return;
    try {
      let posAnterior = -1;
      for (let passo = 1; passo <= 14; passo++) {
        await aguardarSePausado();
        if (estado.cancelado || estado.salvarAgora) break;

        window.scrollBy({ top: 650, behavior: "smooth" });
        atualizarUI(rotulo, `Rolando a página (${passo}/14) para carregar vitrines...`);
        await dormir(Math.max(300, config.delayMs));

        const posAtual = window.scrollY;
        const alturaMax = document.documentElement.scrollHeight - window.innerHeight;
        if (posAtual >= alturaMax - 50 || (passo > 3 && posAtual === posAnterior)) {
          break;
        }
        posAnterior = posAtual;
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {}
  };

  // Garante que o Token da sessão do SuperKoch está ativo (PASSIVO + AUTO-RENOVAÇÃO SEM PARAR!)
  let ultimaTentativaGql = 0;
  const garantirTokenNoPontoExato = async (contextoParada = "", forcarEspera = false) => {
    if (estado.token) return estado.token;

    // 1. Tenta renovar token via GraphQL / sessão
    if (Date.now() - ultimaTentativaGql > 15000 || forcarEspera) {
      ultimaTentativaGql = Date.now();
      await tentarRenovarTokenViaGraphQL();
      if (estado.token) return estado.token;
    }

    // 2. Estimula rolagem leve para capturar token de sessão ativa da página
    try {
      window.scrollBy(0, 350);
      setTimeout(() => window.scrollTo(0, 0), 400);
    } catch (e) {}

    for (let t = 0; t < 10; t++) {
      if (estado.token || estado.cancelado) return estado.token;
      await dormir(300);
    }

    // 3. Se o servidor exigiu token (401/403), tenta coletar automaticamente a cada 30s sem nunca parar!
    if (!estado.token && !estado.cancelado && forcarEspera) {
      estado.aguardandoToken = true;
      salvarCheckpointLocal();
      let cicloToken = 0;
      while (!estado.token && !estado.cancelado) {
        cicloToken++;
        const msgParada = `Renovando token automaticamente (tentativa #${cicloToken}) em: ${contextoParada || "Início"} (Pág ${estado.paginaAtualNaRota}, offset ${estado.offsetFromAtual})...`;
        exibirAlertaParada(true, "🔑 Renovando Token Automaticamente", msgParada);
        registrarLog("ESPERADO", "Token", msgParada);
        atualizarUI("🔑 Coletando Token...", msgParada);
        await enviarTelemetriaAoVivo(true, "RODANDO", msgParada);

        await tentarRenovarTokenViaGraphQL();
        try {
          window.scrollBy(0, 400);
          setTimeout(() => window.scrollTo(0, 0), 500);
        } catch (e) {}

        for (let s = 0; s < 30; s++) {
          if (estado.token || estado.cancelado) break;
          await dormir(1000);
        }
      }
      estado.aguardandoToken = false;
      exibirAlertaParada(false);
    }
    return estado.token;
  };

  // =======================================================================
  // MOTOR DE REQUISIÇÃO ININTERRUPTO (NUNCA PARA SOZINHO!)
  // Em erro de rede ou bloqueio, aguarda 5 minutos e tenta novamente do mesmo ponto!
  // Em erro de token (401/403), coleta novo token e continua!
  // =======================================================================
  const aguardarCincoMinutosRobo = async (contextoLog, motivo) => {
    const totalSegundos = 300; // 5 minutos = 300s
    salvarCheckpointLocal();
    if (estado.novosDesdeUltimoSave > 0 || estado.atualizadosDesdeUltimoSave > 0) {
      await gravarNoFirebase(true, `Save preventivo antes da espera de 5m (${motivo})`);
    }
    for (let segRestante = totalSegundos; segRestante > 0; segRestante--) {
      if (estado.cancelado || estado.salvarAgora) break;
      await aguardarSePausado();
      if (segRestante % 10 === 0 || segRestante === totalSegundos) {
        const min = Math.floor(segRestante / 60);
        const seg = segRestante % 60;
        const msgEspera = `⏳ [${motivo}] Aguardando ${min}m ${seg}s para tentar novamente em ${contextoLog} (Pág ${estado.paginaAtualNaRota})...`;
        exibirAlertaParada(true, "⏳ Aguardando 5 Minutos p/ Retentar Automaticamente", msgEspera);
        atualizarUI(null, msgEspera);
        await enviarTelemetriaAoVivo(true, "BLOQUEIO_ESPERA", msgEspera);
      }
      await dormir(1000);
    }
    exibirAlertaParada(false);
  };

  const requisitarAPINoPontoExato = async (urlBuilderFn, contextoLog) => {
    lerConfigDaUI();
    let tentativa = 0;

    while (!estado.cancelado && !estado.salvarAgora) {
      tentativa++;
      await aguardarSePausado();
      if (estado.cancelado || estado.salvarAgora) return null;

      const url = urlBuilderFn();
      try {
        estado.requisicoesFeitas++;
        const headers = { "accept": "application/json, text/plain, */*" };
        if (estado.token) headers[headerTokenKey] = estado.token;

        const resp = await fetch(url, { method: "GET", headers });

        if (resp.ok) {
          if (estado.bloqueioAtivo) {
            estado.bloqueioAtivo = false;
            exibirAlertaParada(false);
          }
          return await resp.json();
        }

        // Token expirado ou exigido (401 / 403): coleta novo token automaticamente e continua!
        if (resp.status === 401 || resp.status === 403) {
          registrarLog("ESPERADO", contextoLog, `Token solicitado/expirado (HTTP ${resp.status}) na pág ${estado.paginaAtualNaRota}. Coletando novo token e continuando...`);
          estado.token = "";
          estado.customerId = "";
          estado.isEmployee = "";
          salvarCheckpointLocal();
          await garantirTokenNoPontoExato(contextoLog, true);
          continue;
        }

        // Muitas requisições / Rate Limit (429) ou instabilidade do servidor (500+): espera 5 minutos e tenta novamente sem parar!
        if (resp.status === 429 || resp.status >= 500) {
          estado.bloqueioAtivo = true;
          const msgBloq = `HTTP ${resp.status} em ${contextoLog} (Pág ${estado.paginaAtualNaRota}, offset ${estado.offsetFromAtual}). Aguardando 5 minutos para tentar novamente (Tentativa #${tentativa})...`;
          registrarLog("ESPERADO", contextoLog, msgBloq);
          await aguardarCincoMinutosRobo(contextoLog, `HTTP ${resp.status} - Tentativa #${tentativa}`);
          await tentarRenovarTokenViaGraphQL();
          continue;
        }

        // 400 ou 404: filtro/página não existe
        if (resp.status === 400 || resp.status === 404) {
          registrarLog("ESPERADO", contextoLog, `API retornou HTTP ${resp.status} para este parâmetro.`);
          return null;
        }

        registrarLog("INESPERADO", contextoLog, `Status HTTP inesperado: ${resp.status}. Aguardando 5 min e tentando novamente...`);
        await aguardarCincoMinutosRobo(contextoLog, `HTTP ${resp.status}`);
      } catch (err) {
        registrarLog("INESPERADO", contextoLog, `Erro de rede na tentativa #${tentativa} (${err.message}). Aguardando 5 minutos e tentando novamente...`, err.message);
        await aguardarCincoMinutosRobo(contextoLog, `Erro de Rede #${tentativa}`);
      }
    }
    return null;
  };

  // Construtor de URL 100% idêntico ao bundle oficial do SuperKoch + Rotação de Proxy Opcional (Caminho 4)
  const montarUrlBuscaOSuper = ({ promo = false, size = config.size, from = 0, search = "", categoryId = "", categoryName = "", sortField = "sales_count", sortOrder = "desc" }) => {
    const base = `https://sense.osuper.com.br${estado.storePath}`;
    const q = [];
    if (promo) q.push("promotion=true");
    q.push(`brands=`);
    q.push(`categories=${categoryName ? encodeURIComponent(categoryName) : ""}`);
    q.push(`tags=`);
    if (promo) {
      q.push(`onlyPersonas=false`);
      q.push(`cashback=false`);
    }
    if (estado.customerId) {
      q.push(`customerId=${encodeURIComponent(estado.customerId)}`);
      if (estado.isEmployee) q.push(`isEmployee=${encodeURIComponent(estado.isEmployee)}`);
    }
    if (promo && estado.hidePersonas) q.push(`hidePersonas=${estado.hidePersonas}`);
    q.push(`size=${size}`);
    q.push(`from=${from}`);
    q.push(`search=${encodeURIComponent(search)}`);
    q.push(`sortField=${sortField}`);
    q.push(`sortOrder=${sortOrder}`);
    if (categoryId) q.push(`categoryId=${encodeURIComponent(categoryId)}`);
    const urlFinal = `${base}?${q.join("&")}`;

    if (config.usarProxy && Array.isArray(config.listaProxies) && config.listaProxies.length > 0) {
      const proxyBase = config.listaProxies[indiceProxyAtual % config.listaProxies.length];
      indiceProxyAtual++;
      if (proxyBase && proxyBase.startsWith("http")) {
        return proxyBase.includes("?url=") || proxyBase.includes("&url=")
          ? `${proxyBase}${encodeURIComponent(urlFinal)}`
          : `${proxyBase.replace(/\/$/, "")}/?url=${encodeURIComponent(urlFinal)}`;
      }
    }
    return urlFinal;
  };

  // =======================================================================
  // VARREDURA COMPLETA DE UMA CATEGORIA / SUBCATEGORIA ATÉ ACABAR OS ITENS
  // =======================================================================
  const varrerRotaAteAcabar = async (rota, idxRota, pctBase) => {
    const rotulo = `[${idxRota + 1}/${rotasAtivas.length}] ${rota.nome}`;
    if (!estado.progressoPorRota[idxRota]) {
      estado.progressoPorRota[idxRota] = { status: "rodando", lidos: 0, pags: 0 };
    } else {
      estado.progressoPorRota[idxRota].status = "rodando";
    }
    if (estado.abaAtual === "fila") renderizarListaRotas();

    // 1. Navega visualmente apenas se o modo visual estiver marcado
    atualizarUI(`🌐 Lendo: ${rota.nome}`, `Consultando ${rota.pathReal} em ritmo humano...`, pctBase, null, rota.url);
    await navegarParaLinkSPA(rota);

    // Se for a Home ("/") ou "/categorias", coleta os destaques suavemente e passa adiante
    if (rota.tipo === "home" || rota.tipo === "categorias_index") {
      await rolarPaginaVisualmenteAteOFim(rotulo);
      if (rota.tipo === "home") {
        const dadosHome = await requisitarAPINoPontoExato(
          () => montarUrlBuscaOSuper({ promo: true, size: config.size, from: 0 }),
          rotulo
        );
        if (dadosHome && Array.isArray(dadosHome.hits)) {
          const { ultimoTexto } = processarHits(dadosHome.hits, rota);
          estado.progressoPorRota[idxRota].lidos += dadosHome.hits.length;
          estado.progressoPorRota[idxRota].pags = 1;
          atualizarUI(rotulo, `Página Inicial lida (${dadosHome.hits.length} destaques)`, pctBase, ultimoTexto, rota.url);
        }
      }
      estado.progressoPorRota[idxRota].status = "concluido";
      estado.offsetFromAtual = 0;
      estado.paginaAtualNaRota = 1;
      salvarCheckpointLocal();
      return;
    }

    // 2. Para Departamentos, Subcategorias e Promoções: pagina até acabar TODOS os itens com intervalo humano!
    let from = estado.offsetFromAtual || 0;
    let pag = Math.floor(from / config.size) + 1;
    let totalLidosNaRota = estado.progressoPorRota[idxRota].lidos || 0;
    const idsVistosNestaRota = new Set();
    const maxPagsSeguranca = 500;

    while (pag <= maxPagsSeguranca && !estado.cancelado && !estado.salvarAgora) {
      await aguardarSePausado();
      if (estado.cancelado || estado.salvarAgora) break;

      estado.offsetFromAtual = from;
      estado.paginaAtualNaRota = pag;
      salvarCheckpointLocal();

      await rolarPassoNaPagina();

      const ehPromo = rota.tipo === "promocoes";
      const dados = await requisitarAPINoPontoExato(
        () => montarUrlBuscaOSuper({
          promo: ehPromo,
          size: config.size,
          from,
          categoryId: rota.id || "",
          categoryName: !rota.id && !ehPromo ? rota.nome.split(">").pop().trim() : "",
          sortField: "sales_count",
          sortOrder: "desc"
        }),
        rotulo
      );

      if (!dados || estado.cancelado || estado.salvarAgora) break;

      const hits = Array.isArray(dados.hits) ? dados.hits : [];
      if (hits.length === 0) {
        break;
      }

      let inéditosNaRota = 0;
      hits.forEach(h => {
        if (h && h.id && !idsVistosNestaRota.has(h.id)) {
          idsVistosNestaRota.add(h.id);
          inéditosNaRota++;
        }
      });

      totalLidosNaRota += hits.length;
      const { ultimoTexto, novosNesteLote, precosNesteLote } = processarHits(hits, rota);

      if (typeof dados.total === "number" && dados.total > 0) {
        estado.totalPaginasEstimadoRota = Math.max(1, Math.ceil(dados.total / config.size));
      }

      estado.progressoPorRota[idxRota].lidos = totalLidosNaRota;
      estado.progressoPorRota[idxRota].pags = pag;

      const totalApiInfo = dados.total ? ` de ${dados.total}` : "";
      atualizarUI(
        `📂 ${rotulo}`,
        `Pág ${pag} (${totalLidosNaRota}${totalApiInfo} itens • +${novosNesteLote} novos • 🔄${precosNesteLote} preços)`,
        pctBase,
        ultimoTexto,
        rota.url
      );
      if (estado.abaAtual === "fila") renderizarListaRotas();

      // Auto-save inteligente: Salva ao adicionar >= 1 novo OU atualizar >= 50 existentes (com respiro de 25s durante páginas)
      await verificarAutoSaveInteligente(rota.nome, false);
      await enviarTelemetriaAoVivo(false);

      // Verifica se acabou todos os itens desta categoria
      const temProxima = Boolean(
        (dados.hasNext === true) ||
        (typeof dados.nextFrom === "number" && dados.nextFrom > from) ||
        (typeof dados.total === "number" && (from + hits.length) < dados.total)
      );

      if (!temProxima || hits.length < config.size || inéditosNaRota === 0) {
        registrarLog("OK", rotulo, `Todos os itens coletados! Fim na pág. ${pag} (${totalLidosNaRota} produtos lidos).`);
        break;
      }

      // Avança para o próximo lote respeitando tempo humano com variação aleatória (Jitter)
      from = (typeof dados.nextFrom === "number" && dados.nextFrom > from) ? dados.nextFrom : (from + config.size);
      pag++;
      await dormirHumano(config.delayMs);
    }

    if (!estado.cancelado && !estado.salvarAgora) {
      estado.progressoPorRota[idxRota].status = "concluido";
      estado.offsetFromAtual = 0;
      estado.paginaAtualNaRota = 1;
      salvarCheckpointLocal();
      if (estado.abaAtual === "fila") renderizarListaRotas();
    }
  };

  // =======================================================================
  // FLUXO PRINCIPAL SEQUENCIAL (COM RITMO HUMANO E PAUSAS DE RESPIRO)
  // =======================================================================
  const iniciarFluxoSequencial = async () => {
    if (estado.rodando) return;
    lerConfigDaUI();
    sincronizarApolloStateDaPagina();

    estado.rodando = true;
    estado.pausado = false;
    estado.cancelado = false;
    estado.salvarAgora = false;

    btnStart.disabled = true;
    btnStart.style.background = "#1e293b";
    btnStart.style.color = "#64748b";
    btnPause.disabled = false;
    btnPause.style.color = "#fff";
    btnCancel.disabled = false;
    btnCancel.style.background = "#991b1b";
    btnCancel.style.color = "#fef2f2";
    elDot.style.background = "#22c55e";

    mudarAba("live");
    registrarLog("OK", "Sistema", `Iniciando varredura furtiva a partir do link #${estado.indiceRotaAtual + 1} de ${rotasAtivas.length} (size=${config.size}, delay=${config.delayMs}ms).`);
    await enviarTelemetriaAoVivo(true, "RODANDO", "Iniciando fila sequencial...");

    try {
      // Tenta capturar token passivamente (sem travar caso seja visitante)
      await garantirTokenNoPontoExato(rotasAtivas[estado.indiceRotaAtual]?.nome || "Início", false);
      if (estado.cancelado) return;

      // Percorre cada link da sequência personalizada, exatamente na ordem definida
      for (let i = estado.indiceRotaAtual; i < rotasAtivas.length; i++) {
        await aguardarSePausado();
        if (estado.cancelado || estado.salvarAgora) break;

        estado.indiceRotaAtual = i;
        const rota = rotasAtivas[i];
        const pct = Math.max(2, Math.round(((i + 1) / rotasAtivas.length) * 95));

        await varrerRotaAteAcabar(rota, i, pct);

        // Verifica imediatamente ao concluir a categoria se bateu >= 1 novo ou >= 50 atualizados
        await verificarAutoSaveInteligente(rota.nome, true);

        // Salva no Firebase ao concluir cada Departamento principal ou Promoções se restar qualquer pendência
        if ((rota.tipo === "depto" || rota.tipo === "promocoes") && (estado.novosDesdeUltimoSave > 0 || estado.atualizadosDesdeUltimoSave > 0)) {
          await gravarNoFirebase(true, `Fim do Depto ${rota.nome}`);
        }

        if (!estado.cancelado && !estado.salvarAgora) {
          // A cada 12 categorias concluídas, faz uma pausa extra de respiro (10s a 14s) para nunca acionar firewall
          if ((i + 1) % 12 === 0) {
            atualizarUI("☕ Pausa Furtiva de Respiro...", "Aguardando ~10s a cada 12 categorias para simular navegação humana...", pct);
            await enviarTelemetriaAoVivo(true, "RODANDO", "☕ Pausa furtiva de respiro (~10s)...");
            await dormirHumano(9500);
          } else {
            await dormirHumano(config.delayTrocaRotaMs);
          }
        }
      }

      // Repescagem Global Final (para garantir 100% dos itens mesmo se algum produto estiver sem categoria no mercado)
      if (config.repescagemGlobalFinal && !estado.cancelado && !estado.salvarAgora) {
        registrarLog("OK", "Repescagem", "Iniciando verificação final global para capturar eventuais itens sem categoria...");
        const ordensFinais = [
          { field: "sales_count", order: "desc", nome: "Catálogo Geral (Mais Vendidos)" },
          { field: "price", order: "asc", nome: "Catálogo Geral (Menor Preço)" },
          { field: "price", order: "desc", nome: "Catálogo Geral (Maior Preço)" }
        ];

        for (let o = 0; o < ordensFinais.length; o++) {
          if (estado.cancelado || estado.salvarAgora) break;
          const ord = ordensFinais[o];
          let fromGlobal = 0;

          for (let pagG = 1; pagG <= 110; pagG++) {
            await aguardarSePausado();
            if (estado.cancelado || estado.salvarAgora) break;

            estado.paginaAtualNaRota = pagG;
            estado.offsetFromAtual = fromGlobal;
            const dadosG = await requisitarAPINoPontoExato(
              () => montarUrlBuscaOSuper({ size: config.size, from: fromGlobal, sortField: ord.field, sortOrder: ord.order }),
              `🌐 Repescagem: ${ord.nome}`
            );
            if (!dadosG || !Array.isArray(dadosG.hits) || dadosG.hits.length === 0) break;

            const { ultimoTexto, novosNesteLote } = processarHits(dadosG.hits, null);
            atualizarUI(`🌐 Repescagem Final: ${ord.nome}`, `Pág ${pagG} • +${novosNesteLote} novos encontrados`, 94 + (o * 2), ultimoTexto, "https://www.superkoch.com.br/");

            await verificarAutoSaveInteligente(ord.nome, false);

            if (!dadosG.hasNext && dadosG.nextFrom == null && dadosG.hits.length < config.size) break;
            fromGlobal = (typeof dadosG.nextFrom === "number" && dadosG.nextFrom > fromGlobal) ? dadosG.nextFrom : (fromGlobal + config.size);
            await dormirHumano(config.delayMs);
          }
        }
      }

      // Gravação Final no Firebase
      await gravarNoFirebase(false, estado.cancelado ? "Parada Manual" : "Extração 100% Concluída");

      if (!estado.cancelado) {
        limparCheckpointLocal();
        elDot.style.background = "#22c55e";
        atualizarUI("✅ Extração 100% Concluída!", `Total salvo no Firebase: ${mapaProdutos.size} produtos (+${estado.novosNaSessao} novos • 🔄${estado.precosAlteradosNaSessao} preços).`, 100, null, "Concluído!");
        registrarLog("OK", "Concluído", `Todas as ${rotasAtivas.length} rotas finalizadas! ${mapaProdutos.size} produtos únicos salvos.`);
        await enviarTelemetriaAoVivo(true, "CONCLUIDO", `🎉 Concluído! ${mapaProdutos.size} produtos (+${estado.novosNaSessao} novos, 🔄${estado.precosAlteradosNaSessao} preços).`);
      } else {
        salvarCheckpointLocal();
        atualizarUI("⏸ Parado no Checkpoint Exato", `Salvo em #${estado.indiceRotaAtual + 1} (${rotasAtivas[estado.indiceRotaAtual]?.nome}), pág ${estado.paginaAtualNaRota}.`);
        await enviarTelemetriaAoVivo(true, "CANCELADO_SALVO", `⏹ Parado e salvo em #${estado.indiceRotaAtual + 1} (pág ${estado.paginaAtualNaRota}).`);
      }

    } catch (erroFatal) {
      salvarCheckpointLocal();
      elDot.style.background = "#ef4444";
      registrarLog("INESPERADO", "Fatal", "Erro não tratado no fluxo principal. Checkpoint salvo.", erroFatal.message);
      atualizarUI("❌ Erro (Checkpoint Salvo)", erroFatal.message);
      await enviarTelemetriaAoVivo(true, "ERRO", erroFatal.message);
    } finally {
      estado.rodando = false;
      btnStart.disabled = false;
      btnStart.innerText = estado.indiceRotaAtual > 0 && estado.indiceRotaAtual < rotasAtivas.length
        ? `▶ Retomar (#${estado.indiceRotaAtual + 1})`
        : "▶ Reiniciar Fila";
      btnStart.style.background = "#22c55e";
      btnStart.style.color = "#020617";
      btnPause.disabled = true;
      btnPause.style.color = "#64748b";
      btnCancel.disabled = true;
      btnCancel.style.background = "#1e293b";
      btnCancel.style.color = "#64748b";
    }
  };

  // Eventos dos botões de controle
  btnStart.onclick = iniciarFluxoSequencial;

  btnPause.onclick = async () => {
    if (!estado.rodando) return;
    estado.pausado = !estado.pausado;
    salvarCheckpointLocal();
    btnPause.innerText = estado.pausado ? "▶ Retomar" : "⏸ Pausar";
    btnPause.style.background = estado.pausado ? "#2563eb" : "#1e293b";
    elDot.style.background = estado.pausado ? "#f59e0b" : "#22c55e";
    const rotaAt = rotasAtivas[estado.indiceRotaAtual];
    atualizarUI(
      estado.pausado ? `⏸ Pausado em #${estado.indiceRotaAtual + 1}: ${rotaAt?.nome}` : "▶ Retomando do ponto exato...",
      estado.pausado ? `Parado na Pág ${estado.paginaAtualNaRota} (offset ${estado.offsetFromAtual}). Salvando progresso...` : null
    );
    if (estado.pausado && (estado.novosDesdeUltimoSave > 0 || estado.atualizadosDesdeUltimoSave > 0)) {
      await gravarNoFirebase(true, `Salvo ao Pausar em ${rotaAt?.nome}`);
    }
    await enviarTelemetriaAoVivo(true, estado.pausado ? "PAUSADO" : "RODANDO");
    registrarLog("OK", "Controle", estado.pausado
      ? `Extração pausada exatamente em #${estado.indiceRotaAtual + 1} (${rotaAt?.nome}), pág ${estado.paginaAtualNaRota}.`
      : "Extração retomada do ponto exato.");
  };

  btnSave.onclick = async () => {
    const txtOrig = btnSave.innerText;
    btnSave.innerText = "⏳...";
    salvarCheckpointLocal();
    await gravarNoFirebase(false, "Save Manual");
    btnSave.innerText = "✅ Salvo";
    setTimeout(() => { btnSave.innerText = txtOrig; }, 1500);
  };

  btnCancel.onclick = async () => {
    if (!estado.rodando) return;
    estado.cancelado = true;
    estado.pausado = false;
    salvarCheckpointLocal();
    elDot.style.background = "#ef4444";
    atualizarUI("⏹ Parando no ponto exato e salvando...", "Salvando progresso e checkpoint para retomada futura...");
    registrarLog("OK", "Controle", `Parada solicitada em #${estado.indiceRotaAtual + 1} (pág ${estado.paginaAtualNaRota}). Salvando no Firebase.`);
  };
}