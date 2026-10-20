import { chromium } from "playwright";
import fs from "node:fs";

// =========================================================================
// ROBÔ EXTRATOR INVISÍVEL NA NUVEM V8 (GITHUB ACTIONS + CONTROLE REMOTO MOBILE + PROTEÇÃO FIREBASE)
// =========================================================================

const FIREBASE_BASE = (process.env.FIREBASE_BASE_URL || "https://mercaro-e6035-default-rtdb.firebaseio.com/").replace(/\/$/, "");
const FIREBASE_ENDPOINT = `${FIREBASE_BASE}/koch_loja_1408.json`;
const FIREBASE_TELEMETRIA_ENDPOINT = `${FIREBASE_BASE}/robo_controle/telemetria.json`;
const FIREBASE_COMANDOS_ENDPOINT = `${FIREBASE_BASE}/robo_controle/comandos.json`;

const CONFIG = {
  delayMs: Math.max(800, Number(process.env.DELAY_MS) || 2200),
  delayTrocaRotaMs: Math.max(1500, Number(process.env.DELAY_ROTA_MS) || 3800),
  backoffMs: 15000,
  maxRetries: 6,
  size: 12, // Padrão exato do site oficial SuperKoch (var rx = 12)
  salvarAoAdicionar: Math.max(1, Number(process.env.SALVAR_AO_ADICIONAR) || 1),   // Salva ao adicionar 1 produto novo
  salvarAoAtualizar: Math.max(1, Number(process.env.SALVAR_AO_ATUALIZAR) || 50),  // Salva ao atualizar 50 produtos existentes
  cooldownSaveMs: Math.max(10000, Number(process.env.COOLDOWN_SAVE_MS) || 25000), // Respiro mínimo de 25s entre saves de catálogo durante paginação para não pesar
  autoSaveEveryDepto: true,
  startIndex: Math.max(0, (Number(process.env.START_INDEX) || 1) - 1),
  dryRun: String(process.env.DRY_RUN || "false").toLowerCase() === "true"
};

// Lista sequencial personalizada (121 rotas na ordem exata definida pelo usuário)
const ROTAS_SEQUENCIAIS = [
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

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const dormirHumano = (baseMs) => {
  const jitter = Math.floor(Math.random() * Math.max(600, Math.round(baseMs * 0.45)));
  return dormir(baseMs + jitter);
};
const horaAtualBR = () => new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });

const mapaProdutos = new Map();
const dataHojeISO = new Date().toISOString().slice(0, 10);

// Contadores e telemetria ao vivo para acompanhar pelo celular
const sessao = {
  idExecucao: `cloud_${Date.now()}`,
  origem: "GitHub Actions (Nuvem Invisível)",
  iniciadoEm: new Date().toISOString(),
  status: "INICIANDO", // INICIANDO | RODANDO | PAUSADO | BLOQUEIO_ESPERA | CANCELADO_SALVO | CONCLUIDO | ERRO
  mensagem: "Carregando e protegendo banco de dados inicial...",
  rotaIndiceAtual: CONFIG.startIndex,
  rotaTotal: ROTAS_SEQUENCIAIS.length,
  rotaNomeAtual: ROTAS_SEQUENCIAIS[CONFIG.startIndex]?.nome || "Início",
  rotaUrlAtual: ROTAS_SEQUENCIAIS[CONFIG.startIndex]?.url || "",
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
  tempoInicioMs: Date.now(),
  ultimosNovos: [],             // Até 50 novos produtos adicionados
  ultimosPrecosAlterados: [],   // Até 60 produtos que mudaram de preço (Antigo -> Novo)
  ultimosEstoquesAlterados: [], // Até 40 produtos que mudaram estoque/promoção
  ultimosLidos: [],             // Últimos 8 produtos processados
  progressoRotas: {},           // { [idx]: { st: 'ok'|'run'|'skip', lidos: 0, novos: 0, precos: 0, pags: 0 } }
  pausadoRemoto: false,
  canceladoRemoto: false,
  pularRotaAtual: false,
  irParaRotaIndice: null,
  ultimoComandoIdProcessado: 0
};

// =========================================================================
// SINCRONIZAÇÃO LEVE COM PAINEL MOBILE (TELEMETRIA ~2KB + COMANDOS REMOTOS)
// =========================================================================
let ultimoEnvioTelemetriaMs = 0;

function calcularTempoRestanteStr() {
  const rotasConcluidas = Math.max(0, sessao.rotaIndiceAtual - CONFIG.startIndex);
  const rotasRestantes = Math.max(0, sessao.rotaTotal - sessao.rotaIndiceAtual);
  if (rotasRestantes === 0) return "Concluindo...";
  const decorridoMs = Date.now() - sessao.tempoInicioMs;
  if (rotasConcluidas >= 2 && decorridoMs > 15000) {
    const mediaPorRotaMs = decorridoMs / rotasConcluidas;
    const restanteMin = Math.max(1, Math.round((mediaPorRotaMs * rotasRestantes) / 60000));
    return restanteMin >= 60
      ? `~${Math.floor(restanteMin / 60)}h ${restanteMin % 60}min (${rotasRestantes} categorias restantes)`
      : `~${restanteMin} min (${rotasRestantes} categorias restantes)`;
  }
  // Estimativa inicial baseada nos delays configurados (~35s por subcategoria em média)
  const estMin = Math.max(1, Math.round((rotasRestantes * (CONFIG.delayMs * 8 + CONFIG.delayTrocaRotaMs)) / 60000));
  return `~${estMin} min (${rotasRestantes} categorias restantes)`;
}

async function enviarTelemetriaAoVivo(forcar = false) {
  const agora = Date.now();
  if (!forcar && agora - ultimoEnvioTelemetriaMs < 2500) return;
  ultimoEnvioTelemetriaMs = agora;

  const pct = Math.min(100, Math.max(1, Math.round(((sessao.rotaIndiceAtual + 1) / sessao.rotaTotal) * 100)));
  const payload = {
    idExecucao: sessao.idExecucao,
    origem: sessao.origem,
    iniciadoEm: sessao.iniciadoEm,
    atualizadoEm: new Date().toISOString(),
    heartbeatMs: agora,
    status: sessao.status,
    mensagem: sessao.mensagem,
    progressoPct: sessao.status === "CONCLUIDO" ? 100 : pct,
    tempoRestante: sessao.status === "CONCLUIDO" ? "Concluído!" : calcularTempoRestanteStr(),
    rotaIndiceAtual: sessao.rotaIndiceAtual + 1,
    rotaTotal: sessao.rotaTotal,
    categoriasFaltando: Math.max(0, sessao.rotaTotal - (sessao.rotaIndiceAtual + 1)),
    rotaNomeAtual: sessao.rotaNomeAtual,
    rotaUrlAtual: sessao.rotaUrlAtual,
    paginaAtual: sessao.paginaAtual,
    totalPaginasEstimadoRota: sessao.totalPaginasEstimadoRota,
    offsetAtual: sessao.offsetAtual,
    totalInicialFirebase: sessao.totalInicialFirebase,
    totalAtualNoBanco: mapaProdutos.size,
    totalLidosNaSessao: sessao.totalLidosNaSessao,
    novosNaSessao: sessao.novosNaSessao,
    precosAlteradosNaSessao: sessao.precosAlteradosNaSessao,
    estoquesAlteradosNaSessao: sessao.estoquesAlteradosNaSessao,
    atualizadosNaSessao: sessao.atualizadosNaSessao,
    novosDesdeUltimoSave: sessao.novosDesdeUltimoSave,
    atualizadosDesdeUltimoSave: sessao.atualizadosDesdeUltimoSave,
    savesRealizados: sessao.savesRealizados,
    ultimoSaveEm: sessao.ultimoSaveEm,
    ultimoSaveMotivo: sessao.ultimoSaveMotivo,
    requisicoesFeitas: sessao.requisicoesFeitas,
    configAtiva: {
      delayMs: CONFIG.delayMs,
      delayTrocaRotaMs: CONFIG.delayTrocaRotaMs,
      salvarAoAdicionar: CONFIG.salvarAoAdicionar,
      salvarAoAtualizar: CONFIG.salvarAoAtualizar,
      cooldownSaveMs: CONFIG.cooldownSaveMs,
      size: CONFIG.size
    },
    ultimosNovos: sessao.ultimosNovos.slice(0, 40),
    ultimosPrecosAlterados: sessao.ultimosPrecosAlterados.slice(0, 50),
    ultimosEstoquesAlterados: sessao.ultimosEstoquesAlterados.slice(0, 30),
    ultimosLidos: sessao.ultimosLidos.slice(0, 8),
    progressoRotas: sessao.progressoRotas
  };

  try {
    await fetch(FIREBASE_TELEMETRIA_ENDPOINT, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {}
}

let ultimaLeituraComandosMs = 0;
async function verificarComandosRemotos(forcar = false) {
  const agora = Date.now();
  if (!forcar && agora - ultimaLeituraComandosMs < 2200) return;
  ultimaLeituraComandosMs = agora;

  try {
    const resp = await fetch(`${FIREBASE_COMANDOS_ENDPOINT}?t=${agora}`);
    if (!resp.ok) return;
    const cmd = await resp.json();
    if (!cmd || typeof cmd !== "object") return;

    // Aplica configurações em tempo real se enviadas pelo painel web/celular
    if (cmd.config && typeof cmd.config === "object") {
      if (Number(cmd.config.delayMs) >= 600) CONFIG.delayMs = Number(cmd.config.delayMs);
      if (Number(cmd.config.delayTrocaRotaMs) >= 1000) CONFIG.delayTrocaRotaMs = Number(cmd.config.delayTrocaRotaMs);
      if (Number(cmd.config.salvarAoAdicionar) >= 1) CONFIG.salvarAoAdicionar = Number(cmd.config.salvarAoAdicionar);
      if (Number(cmd.config.salvarAoAtualizar) >= 1) CONFIG.salvarAoAtualizar = Number(cmd.config.salvarAoAtualizar);
      if (Number(cmd.config.cooldownSaveMs) >= 5000) CONFIG.cooldownSaveMs = Number(cmd.config.cooldownSaveMs);
    }

    const cmdId = Number(cmd.id || cmd.timestamp || 0);
    if (!cmdId || cmdId <= sessao.ultimoComandoIdProcessado) return;
    sessao.ultimoComandoIdProcessado = cmdId;

    const acao = String(cmd.acao || "").toUpperCase();
    console.log(`📱 [Controle Remoto Celular/Web] Comando recebido: ${acao}`);

    if (acao === "PAUSAR") {
      sessao.pausadoRemoto = true;
      sessao.status = "PAUSADO";
      sessao.mensagem = `⏸ Pausado pelo controle remoto em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Progresso salvo!`;
      await gravarComSegurancaNoFirebase("Salvo ao Pausar pelo Painel");
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "RETOMAR") {
      sessao.pausadoRemoto = false;
      sessao.status = "RODANDO";
      sessao.mensagem = `▶ Retomando execução em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual})...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "SALVAR_AGORA") {
      sessao.mensagem = `💾 Salvamento manual solicitado pelo painel...`;
      await gravarComSegurancaNoFirebase("Salvo Manualmente pelo Painel");
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "PULAR_ROTA") {
      sessao.pularRotaAtual = true;
      sessao.pausadoRemoto = false;
      sessao.mensagem = `⏭ Pulando categoria ${sessao.rotaNomeAtual} por comando remoto...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "IR_PARA_ROTA" && Number(cmd.rotaNumero) >= 1 && Number(cmd.rotaNumero) <= ROTAS_SEQUENCIAIS.length) {
      sessao.irParaRotaIndice = Number(cmd.rotaNumero) - 1;
      sessao.pularRotaAtual = true;
      sessao.pausadoRemoto = false;
      sessao.mensagem = `🎯 Indo para categoria #${cmd.rotaNumero} (${ROTAS_SEQUENCIAIS[sessao.irParaRotaIndice]?.nome})...`;
      await enviarTelemetriaAoVivo(true);
    } else if (acao === "CANCELAR") {
      sessao.canceladoRemoto = true;
      sessao.pausadoRemoto = false;
      sessao.status = "CANCELADO_SALVO";
      sessao.mensagem = `⏹ Cancelado pelo painel em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Salvando tudo no Firebase...`;
      await gravarComSegurancaNoFirebase(`Cancelado pelo Painel em ${sessao.rotaNomeAtual}`);
      await enviarTelemetriaAoVivo(true);
      console.log(`✅ [Controle Remoto] Cancelamento concluído com salvamento seguro.`);
      process.exit(0);
    }
  } catch {}
}

async function aguardarSePausadoRemoto() {
  await verificarComandosRemotos(false);
  while (sessao.pausadoRemoto && !sessao.canceladoRemoto) {
    sessao.status = "PAUSADO";
    await enviarTelemetriaAoVivo(false);
    await dormir(2500);
    await verificarComandosRemotos(true);
  }
}

// =========================================================================
// CAMADA 1 DE PROTEÇÃO DO FIREBASE: LEITURA E BACKUP ANTES DE QUALQUER AÇÃO
// =========================================================================
async function carregarProtegerFirebaseInicial() {
  console.log(`🔒 [Proteção Firebase] Lendo banco atual em: ${FIREBASE_ENDPOINT}`);
  const resp = await fetch(FIREBASE_ENDPOINT);
  if (!resp.ok) {
    throw new Error(`ABORTADO POR SEGURANÇA: Não foi possível ler o Firebase inicial (HTTP ${resp.status}). Nenhuma alteração será feita para proteger seu banco.`);
  }

  // Inicializa o último comando remoto existente para não executar comandos antigos de sessões passadas
  try {
    const rCmd = await fetch(FIREBASE_COMANDOS_ENDPOINT);
    if (rCmd.ok) {
      const cAntigo = await rCmd.json();
      if (cAntigo && (cAntigo.id || cAntigo.timestamp)) {
        sessao.ultimoComandoIdProcessado = Number(cAntigo.id || cAntigo.timestamp || 0);
      }
      // Se na configuração remota existir velocidade ou limites personalizados salvos pelo usuário, aplica:
      if (cAntigo?.config) {
        if (Number(cAntigo.config.salvarAoAdicionar) >= 1) CONFIG.salvarAoAdicionar = Number(cAntigo.config.salvarAoAdicionar);
        if (Number(cAntigo.config.salvarAoAtualizar) >= 1) CONFIG.salvarAoAtualizar = Number(cAntigo.config.salvarAoAtualizar);
      }
    }
  } catch {}

  const dados = await resp.json();
  if (dados && Array.isArray(dados.produtos)) {
    fs.writeFileSync("backup_koch_1408_antes.json", JSON.stringify(dados), "utf-8");

    for (const p of dados.produtos) {
      if (p && p.id) {
        mapaProdutos.set(p.id, p);
      }
    }
    sessao.totalInicialFirebase = mapaProdutos.size;
    sessao.totalAtualNoBanco = mapaProdutos.size;
    console.log(`✅ [Proteção Firebase] ${sessao.totalInicialFirebase} produtos carregados e protegidos na memória (Backup local criado).`);
  } else {
    console.log(`ℹ️ [Proteção Firebase] Banco inicial vazio ou novo (0 produtos).`);
  }
}

// =========================================================================
// CAMADA 2 DE PROTEÇÃO DO FIREBASE: MERGE + DETECÇÃO DE PREÇOS ATUALIZADOS E NOVOS
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

    const precoNormal = Number(item.pricing?.price || item.pricing?.normalPrice || 0);
    const precoPromo = Number(item.pricing?.promotionalPrice || item.activePrice || precoNormal);
    const precoFinal = precoPromo > 0 && precoPromo < precoNormal ? precoPromo : (precoNormal || precoPromo);

    // Se por algum motivo a API vier com preço zerado, preserva o preço anterior do Firebase!
    const precoSeguro = precoFinal > 0 ? precoFinal : Number(existente?.preco || 0);
    const precoOrigSeguro = precoNormal > precoSeguro ? precoNormal : Number(existente?.precoOriginal || precoSeguro);

    const setCats = new Set();
    if (existente && Array.isArray(existente.categorias)) {
      existente.categorias.forEach((c) => { if (typeof c === "string" && c.trim()) setCats.add(c.trim()); });
    }
    if (Array.isArray(item.categories)) {
      item.categories.forEach((c) => {
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
      if (rotaContexto.nome) setCats.add(rotaContexto.nome);
    }

    const imgStr = typeof item.image === "string"
      ? item.image
      : (item.image?.thumborized || item.image?.url || existente?.imagem || "");

    const marcaStr = String(item.brandName || item.brand?.name || existente?.marca || "GENÉRICO").trim();
    const nomeLimpo = String(item.name || existente?.nome || "Produto sem nome").trim();
    const estoqueNovo = item.quantity?.inStock ?? existente?.estoque ?? 0;

    const historico = { ...(existente?.historicoPrecos || {}) };
    if (precoSeguro > 0) {
      historico[dataHojeISO] = precoSeguro;
    }

    const emPromo = Boolean(item.pricing?.promotion || (precoOrigSeguro > precoSeguro && precoSeguro > 0));
    const descPct = item.pricing?.discount || (precoOrigSeguro > precoSeguro && precoOrigSeguro > 0 ? Math.round(((precoOrigSeguro - precoSeguro) / precoOrigSeguro) * 100) : 0);

    // Verifica se é PRODUTO NOVO ou PRODUTO ATUALIZADO (Preço / Estoque / Promoção)
    if (!existente) {
      novosLote++;
      sessao.novosNaSessao++;
      sessao.novosDesdeUltimoSave++;
      sessao.ultimosNovos.unshift({
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
      if (sessao.ultimosNovos.length > 50) sessao.ultimosNovos.pop();
    } else {
      const precoAntigo = Number(existente.preco || 0);
      const precoOrigAntigo = Number(existente.precoOriginal || precoAntigo);
      const estoqueAntigo = Number(existente.estoque ?? 0);
      const mudouPreco = precoSeguro > 0 && Math.abs(precoAntigo - precoSeguro) >= 0.01;
      const mudouPrecoOrig = Math.abs(precoOrigAntigo - precoOrigSeguro) >= 0.01;
      const mudouEstoque = estoqueAntigo !== Number(estoqueNovo);

      if (mudouPreco) {
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
          diferenca,
          pctMudanca,
          estoque: estoqueNovo,
          imagem: imgStr,
          categoria: catRotaNome,
          hora: horaStr
        });
        if (sessao.ultimosPrecosAlterados.length > 60) sessao.ultimosPrecosAlterados.pop();
      } else if (mudouEstoque || mudouPrecoOrig) {
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
          hora: horaStr
        });
        if (sessao.ultimosEstoquesAlterados.length > 40) sessao.ultimosEstoquesAlterados.pop();
      }
    }

    mapaProdutos.set(item.id, {
      id: item.id,
      nome: nomeLimpo,
      marca: marcaStr,
      preco: precoSeguro,
      precoOriginal: precoOrigSeguro,
      emPromocao: emPromo,
      desconto: descPct,
      estoque: estoqueNovo,
      unidade: item.saleUnit || existente?.unidade || "UN",
      imagem: imgStr,
      categorias: Array.from(setCats),
      slug: item.slug || existente?.slug || "",
      historicoPrecos: historico
    });

    sessao.ultimosLidos.unshift(`${nomeLimpo} • R$ ${precoSeguro.toFixed(2).replace(".", ",")}`);
    if (sessao.ultimosLidos.length > 8) sessao.ultimosLidos.pop();
  }

  sessao.totalAtualNoBanco = mapaProdutos.size;
  return { novosLote, precosLote, estoquesLote };
}

// =========================================================================
// GRAVAÇÃO INTELIGENTE COM TRAVA ANTI-ENCOLHIMENTO E ANTI-PESO
// Regra solicitada: Salva quando adicionar >= 1 novo OU atualizar >= 50 existentes
// (respeitando respiro mínimo durante loop de páginas para nunca ficar pesado!)
// =========================================================================
async function gravarComSegurancaNoFirebase(motivo = "") {
  const listaFinal = Array.from(mapaProdutos.values());
  if (listaFinal.length === 0) {
    console.warn(`⚠️ [Proteção Firebase] Lista vazia — gravação ignorada.`);
    return false;
  }

  // TRAVA RÍGIDA ANTI-ENCOLHIMENTO: Nunca permite gravar menos itens do que já existia no banco!
  if (sessao.totalInicialFirebase > 0 && listaFinal.length < sessao.totalInicialFirebase) {
    console.error(`🛑 [Proteção Firebase] TRAVA ACIONADA! Tentativa de gravar ${listaFinal.length} itens, mas o banco tinha ${sessao.totalInicialFirebase}. Operação bloqueada para proteger seu Firebase!`);
    return false;
  }

  if (CONFIG.dryRun) {
    console.log(`🧪 [Modo Teste / Dry Run] Simulação (${motivo}): ${listaFinal.length} produtos prontos.`);
    sessao.novosDesdeUltimoSave = 0;
    sessao.atualizadosDesdeUltimoSave = 0;
    sessao.ultimoSaveMs = Date.now();
    return true;
  }

  const resp = await fetch(FIREBASE_ENDPOINT, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      atualizadoEm: new Date().toISOString(),
      totalItens: listaFinal.length,
      resumoUltimaSessao: {
        novosAdicionados: sessao.novosNaSessao,
        precosAtualizados: sessao.precosAlteradosNaSessao,
        estoquesAtualizados: sessao.estoquesAlteradosNaSessao,
        motivoUltimoSave: motivo
      },
      produtos: listaFinal
    })
  });

  if (!resp.ok) {
    console.error(`❌ [Firebase] Erro HTTP ${resp.status} ao salvar (${motivo}).`);
    return false;
  }

  sessao.totalInicialFirebase = Math.max(sessao.totalInicialFirebase, listaFinal.length);
  sessao.savesRealizados++;
  sessao.ultimoSaveEm = new Date().toISOString();
  sessao.ultimoSaveMotivo = motivo;
  sessao.ultimoSaveMs = Date.now();
  const nSalvos = sessao.novosDesdeUltimoSave;
  const aSalvos = sessao.atualizadosDesdeUltimoSave;
  sessao.novosDesdeUltimoSave = 0;
  sessao.atualizadosDesdeUltimoSave = 0;

  console.log(`☁️ [Firebase Salvo #${sessao.savesRealizados}] ${listaFinal.length} produtos no banco (+${nSalvos} novos, ${aSalvos} atualizados neste lote | Motivo: ${motivo}).`);
  await enviarTelemetriaAoVivo(true);
  return true;
}

async function verificarAutoSaveInteligente(contextoCurto, fimDeRota = false) {
  const atingiuMetaNovos = sessao.novosDesdeUltimoSave >= CONFIG.salvarAoAdicionar;
  const atingiuMetaAtualizados = sessao.atualizadosDesdeUltimoSave >= CONFIG.salvarAoAtualizar;

  if (!atingiuMetaNovos && !atingiuMetaAtualizados) return;

  // Para não ficar pesado enviando 8 MB várias vezes no mesmo segundo, durante a rolagem de páginas
  // respeita o cooldownSaveMs (ex: 25s), mas ao concluir a categoria (fimDeRota=true) salva imediatamente!
  const tempoDesdeUltimoSave = Date.now() - sessao.ultimoSaveMs;
  if (!fimDeRota && tempoDesdeUltimoSave < CONFIG.cooldownSaveMs) {
    return;
  }

  const motivoDetalhe = atingiuMetaNovos
    ? `+${sessao.novosDesdeUltimoSave} novo(s) em ${contextoCurto}`
    : `${sessao.atualizadosDesdeUltimoSave} atualizados em ${contextoCurto}`;

  await gravarComSegurancaNoFirebase(motivoDetalhe);
}

// Construtor de URL 100% idêntico ao site oficial SuperKoch (bundle-B9szzJz7.js)
function montarUrlOficial({ storePath = "/295/1408/v2/search", promo = false, size = 12, from = 0, categoryId = "", categoryName = "" }) {
  const base = `https://sense.osuper.com.br${storePath}`;
  const q = [];
  if (promo) q.push("promotion=true");
  q.push("brands=");
  q.push(`categories=${categoryName ? encodeURIComponent(categoryName) : ""}`);
  q.push("tags=");
  if (promo) {
    q.push("onlyPersonas=false");
    q.push("cashback=false");
    q.push("hidePersonas=690");
  }
  q.push(`size=${size}`);
  q.push(`from=${from}`);
  q.push("search=");
  q.push("sortField=sales_count");
  q.push("sortOrder=desc");
  if (categoryId) q.push(`categoryId=${encodeURIComponent(categoryId)}`);
  return `${base}?${q.join("&")}`;
}

// =========================================================================
// EXECUÇÃO PRINCIPAL DO ROBÔ INVISÍVEL (PLAYWRIGHT HEADLESS FURTIVO)
// =========================================================================
async function executarRoboCloud() {
  await carregarProtegerFirebaseInicial();
  await enviarTelemetriaAoVivo(true);

  console.log(`🚀 Iniciando navegador invisível (Headless Stealth)...`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
  });

  const context = await browser.newContext({
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 }
  });

  const page = await context.newPage();
  let tokenCapturado = "";
  let storePath = "/295/1408/v2/search";

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("sense.osuper.com.br") && url.includes("/v2/search")) {
      try {
        const u = new URL(url);
        storePath = u.pathname;
      } catch {}
    }
    const tk = req.headers()["x-osuper-identity-token"];
    if (tk && tk !== tokenCapturado) {
      tokenCapturado = tk;
      console.log(`🔑 Token de sessão detectado automaticamente.`);
    }
  });

  sessao.status = "RODANDO";
  sessao.mensagem = "Abrindo página inicial do SuperKoch para estabelecer sessão legítima...";
  await enviarTelemetriaAoVivo(true);

  console.log(`🌐 Abrindo página inicial do SuperKoch para estabelecer sessão legítima...`);
  await page.goto("https://www.superkoch.com.br/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await dormirHumano(3500);

  // Função que executa o fetch dentro da própria aba invisível do navegador (mesmo IP/Cookies/Origin do site)
  async function consultarAPINoPontoExato(url, rotulo, pag, from) {
    for (let tentativa = 1; tentativa <= CONFIG.maxRetries; tentativa++) {
      await aguardarSePausadoRemoto();
      sessao.requisicoesFeitas++;

      const resultado = await page.evaluate(async ({ targetUrl, tk }) => {
        try {
          const headers = { accept: "application/json, text/plain, */*" };
          if (tk) headers["x-osuper-identity-token"] = tk;
          const r = await fetch(targetUrl, { method: "GET", headers });
          if (!r.ok) return { ok: false, status: r.status };
          const data = await r.json();
          return { ok: true, status: 200, data };
        } catch (err) {
          return { ok: false, status: 0, error: err.message };
        }
      }, { targetUrl: url, tk: tokenCapturado });

      if (resultado.ok && resultado.data) {
        if (sessao.status === "BLOQUEIO_ESPERA") sessao.status = "RODANDO";
        return resultado.data;
      }

      if (resultado.status === 429 || resultado.status >= 500 || resultado.status === 0 || resultado.status === 401 || resultado.status === 403) {
        const espera = CONFIG.backoffMs * tentativa;
        sessao.status = "BLOQUEIO_ESPERA";
        sessao.mensagem = `⏳ Status ${resultado.status} em ${rotulo} (Pág ${pag}, offset ${from}). Parado no ponto exato! Aguardando ${Math.round(espera / 1000)}s (Tentativa ${tentativa}/${CONFIG.maxRetries})...`;
        console.warn(sessao.mensagem);
        await enviarTelemetriaAoVivo(true);
        await dormirHumano(espera);

        if (resultado.status === 401 || resultado.status === 403) {
          tokenCapturado = "";
          await page.goto("https://www.superkoch.com.br/", { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
          await dormirHumano(4000);
        }
        continue;
      }

      console.warn(`⚠️ [${rotulo}] Status HTTP ${resultado.status} ignorado.`);
      return null;
    }
    throw new Error(`Limite de tentativas excedido em ${rotulo} (Pág ${pag}, offset ${from}). Parando execução com progresso salvo.`);
  }

  try {
    for (let i = CONFIG.startIndex; i < ROTAS_SEQUENCIAIS.length; i++) {
      await aguardarSePausadoRemoto();

      // Verifica se o usuário pediu para pular para uma categoria específica pelo celular
      if (sessao.irParaRotaIndice !== null) {
        i = sessao.irParaRotaIndice;
        sessao.irParaRotaIndice = null;
        sessao.pularRotaAtual = false;
      }

      const rota = ROTAS_SEQUENCIAIS[i];
      if (!rota) break;

      sessao.rotaIndiceAtual = i;
      sessao.rotaNomeAtual = rota.nome;
      sessao.rotaUrlAtual = rota.url;
      sessao.paginaAtual = 1;
      sessao.totalPaginasEstimadoRota = 1;
      sessao.offsetAtual = 0;
      sessao.pularRotaAtual = false;

      const rotulo = `[#${i + 1}/${ROTAS_SEQUENCIAIS.length}] ${rota.nome}`;
      sessao.progressoRotas[i] = { st: "run", lidos: 0, novos: 0, precos: 0, pags: 0 };

      if (rota.tipo === "categorias_index") {
        sessao.progressoRotas[i] = { st: "ok", lidos: 0, novos: 0, precos: 0, pags: 1 };
        console.log(`📂 ${rotulo} -> Índice verificado.`);
        await enviarTelemetriaAoVivo(false);
        continue;
      }

      if (rota.tipo === "home") {
        sessao.mensagem = `🏠 Lendo destaques da Página Inicial...`;
        await enviarTelemetriaAoVivo(true);
        const urlHome = montarUrlOficial({ storePath, promo: true, size: CONFIG.size, from: 0 });
        const dadosHome = await consultarAPINoPontoExato(urlHome, rotulo, 1, 0);
        if (dadosHome?.hits) {
          const { novosLote, precosLote } = processarHits(dadosHome.hits, rota);
          sessao.progressoRotas[i] = { st: "ok", lidos: dadosHome.hits.length, novos: novosLote, precos: precosLote, pags: 1 };
          console.log(`🏠 ${rotulo}: ${dadosHome.hits.length} itens lidos (+${novosLote} novos, ${precosLote} preços alterados).`);
          await verificarAutoSaveInteligente(rota.nome, true);
        }
        await enviarTelemetriaAoVivo(true);
        await dormirHumano(CONFIG.delayTrocaRotaMs);
        continue;
      }

      let from = 0;
      let pag = 1;
      let totalLidosRota = 0;
      let novosRota = 0;
      let precosRota = 0;
      const idsVistosRota = new Set();

      while (pag <= 500 && !sessao.pularRotaAtual) {
        await aguardarSePausadoRemoto();
        if (sessao.pularRotaAtual) break;

        sessao.paginaAtual = pag;
        sessao.offsetAtual = from;
        sessao.mensagem = `📂 ${rotulo} • Lendo Pág ${pag}${sessao.totalPaginasEstimadoRota > 1 ? `/${sessao.totalPaginasEstimadoRota}` : ""} (${totalLidosRota} itens lidos)...`;
        await enviarTelemetriaAoVivo(false);

        const ehPromo = rota.tipo === "promocoes";
        const urlBusca = montarUrlOficial({
          storePath,
          promo: ehPromo,
          size: CONFIG.size,
          from,
          categoryId: rota.id || ""
        });

        const dados = await consultarAPINoPontoExato(urlBusca, rotulo, pag, from);
        if (!dados || !Array.isArray(dados.hits) || dados.hits.length === 0) break;

        if (typeof dados.total === "number" && dados.total > 0) {
          sessao.totalPaginasEstimadoRota = Math.max(1, Math.ceil(dados.total / CONFIG.size));
        }

        let ineditos = 0;
        for (const h of dados.hits) {
          if (h?.id && !idsVistosRota.has(h.id)) {
            idsVistosRota.add(h.id);
            ineditos++;
          }
        }

        totalLidosRota += dados.hits.length;
        const { novosLote, precosLote } = processarHits(dados.hits, rota);
        novosRota += novosLote;
        precosRota += precosLote;

        sessao.progressoRotas[i] = { st: "run", lidos: totalLidosRota, novos: novosRota, precos: precosRota, pags: pag };

        // Verifica se atingiu +1 novo ou 50 atualizados (com proteção de cooldown durante as páginas)
        await verificarAutoSaveInteligente(rota.nome, false);
        await enviarTelemetriaAoVivo(false);

        const temProxima = Boolean(
          dados.hasNext === true ||
          (typeof dados.nextFrom === "number" && dados.nextFrom > from) ||
          (typeof dados.total === "number" && (from + dados.hits.length) < dados.total)
        );

        if (!temProxima || dados.hits.length < CONFIG.size || ineditos === 0) {
          break;
        }

        from = (typeof dados.nextFrom === "number" && dados.nextFrom > from) ? dados.nextFrom : (from + CONFIG.size);
        pag++;
        await dormirHumano(CONFIG.delayMs);
      }

      sessao.progressoRotas[i] = {
        st: sessao.pularRotaAtual ? "skip" : "ok",
        lidos: totalLidosRota,
        novos: novosRota,
        precos: precosRota,
        pags: pag
      };

      console.log(`✅ ${rotulo}: ${totalLidosRota} itens em ${pag} pág(s) (+${novosRota} novos | 🔄 ${precosRota} preços alterados | Total Banco: ${mapaProdutos.size}).`);

      // Ao finalizar uma categoria, verifica imediatamente se tem >= 1 novo ou >= 50 atualizados para salvar!
      await verificarAutoSaveInteligente(rota.nome, true);

      // E se for fim de um Departamento principal com qualquer pendência, garante checkpoint no banco
      if (CONFIG.autoSaveEveryDepto && (rota.tipo === "depto" || rota.tipo === "promocoes") && (sessao.novosDesdeUltimoSave > 0 || sessao.atualizadosDesdeUltimoSave > 0)) {
        await gravarComSegurancaNoFirebase(`Fim do Depto ${rota.nome}`);
      }

      await enviarTelemetriaAoVivo(true);

      if ((i + 1) % 12 === 0 && i + 1 < ROTAS_SEQUENCIAIS.length) {
        sessao.mensagem = `☕ Pausa furtiva de respiro (~12s) após ${i + 1} categorias...`;
        console.log(sessao.mensagem);
        await enviarTelemetriaAoVivo(true);
        await dormirHumano(11000);
      } else {
        await dormirHumano(CONFIG.delayTrocaRotaMs);
      }
    }

    // Gravação final se restou qualquer alteração pendente
    await gravarComSegurancaNoFirebase("Extração 100% Concluída");
    sessao.status = "CONCLUIDO";
    sessao.mensagem = `🎉 Concluído! ${mapaProdutos.size} produtos no banco (+${sessao.novosNaSessao} novos, 🔄 ${sessao.precosAlteradosNaSessao} preços atualizados).`;
    await enviarTelemetriaAoVivo(true);
    console.log(sessao.mensagem);
  } finally {
    await browser.close();
  }
}

// CAPTURA DE SINAIS DE CANCELAMENTO (Se cancelar no GitHub Actions, Painel ou Ctrl+C)
let salvandoCancelamento = false;
const tratarCancelamento = async (sinal) => {
  if (salvandoCancelamento) return;
  salvandoCancelamento = true;
  console.log(`\n🛑 Cancelamento detectado (${sinal}). Salvando imediatamente tudo o que foi coletado até o momento no Firebase...`);
  try {
    sessao.status = "CANCELADO_SALVO";
    sessao.mensagem = `⏹ Cancelado (${sinal}) em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}). Tudo salvo com segurança!`;
    await gravarComSegurancaNoFirebase(`Salvamento por Cancelamento (${sinal})`);
    await enviarTelemetriaAoVivo(true);
    console.log(`✅ Salvo com sucesso antes de encerrar!`);
  } catch (e) {
    console.error(`Erro ao salvar no cancelamento:`, e.message);
  }
  process.exit(0);
};

process.on("SIGINT", () => tratarCancelamento("SIGINT"));
process.on("SIGTERM", () => tratarCancelamento("SIGTERM"));

executarRoboCloud().catch(async (err) => {
  console.error(`❌ Erro durante a execução:`, err.message);
  sessao.status = "ERRO";
  sessao.mensagem = `❌ Parado em ${sessao.rotaNomeAtual} (Pág ${sessao.paginaAtual}): ${err.message}. Progresso salvo!`;
  await gravarComSegurancaNoFirebase("Salvamento de Emergência no Ponto de Parada").catch(() => {});
  await enviarTelemetriaAoVivo(true).catch(() => {});
  process.exit(1);
});
