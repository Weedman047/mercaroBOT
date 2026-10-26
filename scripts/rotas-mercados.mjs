// =========================================================================
// ROTAS OFICIAIS SUPERKOCH (LOJA 1408 ITAPEMA - 121 ROTAS)
// =========================================================================
export const ROTAS_PADRAO_KOCH = [
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

// =========================================================================
// ROTAS OFICIAIS FORT ATACADISTA (LOJA 1644 PORTO BELO - 140 ROTAS)
// =========================================================================
// Rotas Oficiais Fort Atacadista - Loja 1644 Porto Belo (140 rotas)
export const ROTAS_PADRAO_FORT = [
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





// =========================================================================
// CAMADA 1: RADAR DE OFERTAS RELÂMPAGO (SUPER RÁPIDO ~1-2 MINUTOS)
// Rastreia Home, Aba de Promoções e os Top 8 setores mais voláteis
// =========================================================================
export const ROTAS_RADAR_KOCH = [
  { url: "https://www.superkoch.com.br/", pathReal: "/", tipo: "home", id: null, depto: "Página Inicial", nome: "⚡ Radar > Página Inicial (Destaques)" },
  { url: "https://www.superkoch.com.br/promocoes", pathReal: "/promocoes", tipo: "promocoes", id: "PROMO_KOCH", depto: "Promoções", nome: "⚡ Radar > Promoções Ativas" },
  { url: "https://www.superkoch.com.br/categorias/acougue/carnes-bovinas", pathReal: "/categorias/acougue/carnes-bovinas", tipo: "sub", id: "3886563", depto: "Açougue", nome: "⚡ Radar > Carnes Bovinas" },
  { url: "https://www.superkoch.com.br/categorias/acougue/frango", pathReal: "/categorias/acougue/frango", tipo: "sub", id: "3886569", depto: "Açougue", nome: "⚡ Radar > Frango & Aves" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/frutas", pathReal: "/categorias/hortifruti/frutas", tipo: "sub", id: "3659966", depto: "Hortifruti", nome: "⚡ Radar > Frutas" },
  { url: "https://www.superkoch.com.br/categorias/hortifruti/legumes", pathReal: "/categorias/hortifruti/legumes", tipo: "sub", id: "3660005", depto: "Hortifruti", nome: "⚡ Radar > Legumes" },
  { url: "https://www.superkoch.com.br/categorias/frios-e-laticinios/leite", pathReal: "/categorias/frios-laticinios/leite", tipo: "sub", id: "3659921", depto: "Frios & Laticínios", nome: "⚡ Radar > Leite" },
  { url: "https://www.superkoch.com.br/categorias/bebidas-alcoolicas/cervejas", pathReal: "/categorias/bebidas-alcoolicas/cervejas", tipo: "sub", id: "3659885", depto: "Bebidas Alcoólicas", nome: "⚡ Radar > Cervejas" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/alimentos-basicos", pathReal: "/categorias/mercearia/alimentos-basicos", tipo: "sub", id: "3659766", depto: "Mercearia", nome: "⚡ Radar > Alimentos Básicos (Arroz/Feijão)" },
  { url: "https://www.superkoch.com.br/categorias/mercearia/cafes", pathReal: "/categorias/mercearia/cafes", tipo: "sub", id: "3659760", depto: "Mercearia", nome: "⚡ Radar > Cafés" }
];

export const ROTAS_RADAR_FORT = [
  { url: "https://www.fortatacadista.com.br/", pathReal: "/", tipo: "home", id: null, depto: "Página Inicial", nome: "⚡ Radar > Página Inicial (Destaques)" },
  { url: "https://www.fortatacadista.com.br/promocoes", pathReal: "/promocoes", tipo: "promocoes", id: "PROMO_FORT", depto: "Promoções", nome: "⚡ Radar > Todas as Promoções" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-aves-e-peixes/bovinos", pathReal: "/categorias/carnes-aves-e-peixes/bovinos", tipo: "sub", id: "1815170", depto: "Carnes, Aves e Peixes", nome: "⚡ Radar > Bovinos" },
  { url: "https://www.fortatacadista.com.br/categorias/carnes-aves-e-peixes/aves", pathReal: "/categorias/carnes-aves-e-peixes/aves", tipo: "sub", id: "1815174", depto: "Carnes, Aves e Peixes", nome: "⚡ Radar > Aves" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/frutas", pathReal: "/categorias/hortifruti/frutas", tipo: "sub", id: "1815147", depto: "Hortifruti", nome: "⚡ Radar > Frutas" },
  { url: "https://www.fortatacadista.com.br/categorias/hortifruti/legumes", pathReal: "/categorias/hortifruti/legumes", tipo: "sub", id: "1815148", depto: "Hortifruti", nome: "⚡ Radar > Legumes" },
  { url: "https://www.fortatacadista.com.br/categorias/frios-e-laticinios/leites", pathReal: "/categorias/frios-e-laticinios/leites", tipo: "sub", id: "1815187", depto: "Frios e Laticínios", nome: "⚡ Radar > Leites" },
  { url: "https://www.fortatacadista.com.br/categorias/bebidas-alcoolicas/cervejas", pathReal: "/categorias/bebidas-alcoolicas/cervejas", tipo: "sub", id: "1815154", depto: "Bebidas Alcoólicas", nome: "⚡ Radar > Cervejas" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/graos-e-cereais", pathReal: "/categorias/mercearia/graos-e-cereais", tipo: "sub", id: "1815151", depto: "Mercearia", nome: "⚡ Radar > Grãos e Cereais (Arroz/Feijão)" },
  { url: "https://www.fortatacadista.com.br/categorias/mercearia/cafes-e-chas", pathReal: "/categorias/mercearia/cafes-e-chas", tipo: "sub", id: "1815149", depto: "Mercearia", nome: "⚡ Radar > Cafés e Chás" }
];

// =========================================================================
// SELETOR UNIVERSAL DE CAMADAS (1 = RADAR, 2 = TURNO, 3 = COMPLETA)
// =========================================================================
export function obterRotasPorCamada(mercado = "koch", camada = "2A", filaCustom = null) {
  const c = String(camada || "2A").toUpperCase();
  const ehFort = mercado === "fort" || mercado === "fortatacadista";

  if (c === "CUSTOM" && Array.isArray(filaCustom) && filaCustom.length > 0) {
    return filaCustom;
  }

  // Camada 1: RADAR (Ofertas relâmpago, destaques e setores mais voláteis ~1-2 min)
  if (c === "RADAR" || c === "1" || c === "1A" || c === "OFERTAS") {
    return ehFort ? ROTAS_RADAR_FORT : ROTAS_RADAR_KOCH;
  }

  const listaBase = ehFort ? ROTAS_PADRAO_FORT : ROTAS_PADRAO_KOCH;

  // Camada 2: TURNO / 2A (Subcategorias + Promoções - 98% dos itens sem duplicar departamentos)
  if (c === "TURNO" || c === "2" || c === "2A") {
    return listaBase.filter((r) => r.tipo === "sub" || r.tipo === "promocoes" || r.tipo === "promocao");
  }

  // Opção 2B: Somente Departamentos + Promoções
  if (c === "2B" || c === "DEPTOS") {
    return listaBase.filter((r) => r.tipo === "depto" || r.tipo === "promocoes" || r.tipo === "promocao");
  }

  // Camada 3: NOTURNA / COMPLETA (100% de todos os links e departamentos)
  return [...listaBase];
}
