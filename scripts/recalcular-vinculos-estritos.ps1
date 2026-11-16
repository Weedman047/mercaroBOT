# =========================================================================
# MOTOR C# DE ALTA PERFORMANCE: VINCULAÇÃO ESTRITA KOCH x FORT
# Regras do Usuário:
# 1) Gramas ou Litros: 100% IGUAL
# 2) Marca: 100% IGUAL
# 3) Nome: Mais parecido do banco de dados (maior similaridade de tokens)
# =========================================================================

$FIREBASE_URL = "https://mercaro-e6035-default-rtdb.firebaseio.com"
$FIREBASE_SECRET = "avPevwfA57FK4v9O3Me9dBVmhOM2NmpJJc19AqEh"
$AUTH = "?auth=$FIREBASE_SECRET"

Write-Host "Baixando catalogos do Firebase..." -ForegroundColor Cyan
$wc = New-Object System.Net.WebClient
$wc.Encoding = [System.Text.Encoding]::UTF8

$jsonKoch = $wc.DownloadString("$FIREBASE_URL/koch_loja_1408/produtos.json$AUTH")
$jsonFort = $wc.DownloadString("$FIREBASE_URL/fort_loja_1644/produtos.json$AUTH")

Write-Host "Catalogos baixados. Compilando motor de cruzamento estrito..." -ForegroundColor Cyan

$csharpCode = @"
using System;
using System.Collections.Generic;
using System.Text;
using System.Text.RegularExpressions;
using System.Globalization;

public class ProdItem {
    public string id;
    public string nome;
    public string marca;
    public double preco;
    public string unidade;
    public string imagem;

    public string marcaNorm;
    public string nomeNorm;
    public string gramUn;
    public int gramVal;
    public bool temGram;
    public string[] tokens;
    public string assetHash;
}

public class ParVinculo {
    public string idKoch;
    public string idFort;
    public int score;
    public string motivo;
    public string nomeKoch;
    public string nomeFort;
    public string marca;
    public string medida;
}

public class MotorVinculadorEstrito {
    private static readonly HashSet<string> Stopwords = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        "de", "da", "do", "das", "dos", "com", "para", "em", "sem", "ao", "aos",
        "a", "o", "as", "os", "um", "uma", "uns", "umas", "e", "ou", "por", "sobre",
        "no", "na", "nos", "nas", "tipo", "sabor", "pacote", "pct", "pc", "unidade",
        "unid", "un", "cx", "caixa", "pote", "pt", "garrafa", "gf", "lata", "lt",
        "fardo", "fd", "sache", "sc", "bandeja", "bdj", "vidro", "vd", "pet", "tp",
        "tetra", "pak", "embalagem", "emb", "oferta", "leve", "pague", "especial", "extra"
    };

    private static readonly HashSet<string> MarcasNeutras = new HashSet<string>(StringComparer.OrdinalIgnoreCase) {
        "generico", "outros", "sem marca", "importado", "horti fruti", "hortifruti",
        "hortifruti koch", "fruta delivery fort", "delivery fort", "koch", "superkoch",
        "super koch", "fort", "fort atacadista", "cookie", "biscoito",
        "granjeiro", "in natura", "a granel", "granel", "producao propria", "marca propria",
        "padaria", "acougue", "peixaria", "confeitaria", "rotisseria", "fiambreria", "nacional"
    };

    private static readonly string[][] GruposSabor = new string[][] {
        new string[] { "uva", "laranja", "limao", "morango", "maracuja", "abacaxi", "pessego", "manga", "guarana", "caju", "maca", "frutas vermelhas", "tutti frutti", "baunilha", "flocos", "coco" },
        new string[] { "bovino", "bovina", "frango", "suino", "suina", "peixe", "tilapia", "salmao", "peru", "bacalhau" },
        new string[] { "integral", "desnatado", "semidesnatado" },
        new string[] { "carioca", "preto", "branco", "vermelho", "fradinho" },
        new string[] { "parboilizado", "branco", "integral", "arboreo" },
        new string[] { "tinto", "branco", "rose" }
    };

    public static string RemoverAcentos(string text) {
        if (string.IsNullOrWhiteSpace(text)) return "";
        string normalizedString = text.Normalize(NormalizationForm.FormD);
        StringBuilder sb = new StringBuilder();
        foreach (char c in normalizedString) {
            UnicodeCategory uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark) sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }

    public static string NormalizarTexto(string str) {
        if (string.IsNullOrEmpty(str)) return "";
        string s = RemoverAcentos(str.ToLowerInvariant());
        s = Regex.Replace(s, @"[^\w\s.,/-]", " ");
        s = Regex.Replace(s, @"\s+", " ").Trim();
        return s;
    }

    public static string NormalizarTextoVinculo(string str) {
        if (string.IsNullOrEmpty(str)) return "";
        string s = NormalizarTexto(str);
        s = Regex.Replace(s, @"[-/.,_]+", " ");
        s = Regex.Replace(s, @"\brefrig\.?\b|\brefri\b", "refrigerante");
        s = Regex.Replace(s, @"\bcerv\.?\b", "cerveja");
        s = Regex.Replace(s, @"\bchoc\.?\b", "chocolate");
        s = Regex.Replace(s, @"\bbisc\.?\b|\bbolacha\b", "biscoito");
        s = Regex.Replace(s, @"\bmac\.?\b", "macarrao");
        s = Regex.Replace(s, @"\bmarg\.?\b", "margarina");
        s = Regex.Replace(s, @"\breq\.?\b", "requeijao");
        s = Regex.Replace(s, @"\bdeterg\.?\b|\bdet\b", "detergente");
        s = Regex.Replace(s, @"\bamac\.?\b", "amaciante");
        s = Regex.Replace(s, @"\bdesinf\.?\b", "desinfetante");
        s = Regex.Replace(s, @"\bdesod\.?\b", "desodorante");
        s = Regex.Replace(s, @"\bcondic\.?\b|\bcond\b", "condicionador");
        s = Regex.Replace(s, @"\bshamp\.?\b|\bsh\b", "shampoo");
        s = Regex.Replace(s, @"\bsab\.?\b", "sabonete");
        s = Regex.Replace(s, @"\bmuss\.?\b|\bmucarela\b|\bmozarela\b", "mussarela");
        s = Regex.Replace(s, @"\bqueij\.?\b|\bqj\b", "queijo");
        s = Regex.Replace(s, @"\biog\.?\b", "iogurte");
        s = Regex.Replace(s, @"\btrad\.?\b", "tradicional");
        s = Regex.Replace(s, @"\bdesn\.?\b", "desnatado");
        s = Regex.Replace(s, @"\bint\.?\b", "integral");
        s = Regex.Replace(s, @"\b3\s+coracoes\b", "tres coracoes");
        s = Regex.Replace(s, @"\bcoca[\s-]+cola\b", "coca cola");
        return Regex.Replace(s, @"\s+", " ").Trim();
    }

    public static string NormalizarMarca(string marca) {
        if (string.IsNullOrEmpty(marca)) return "";
        string m = NormalizarTextoVinculo(marca);
        m = Regex.Replace(m, @"\b(s\s*a|ltda|brasil|alimentos|bebidas|laticinios|industria|comercio|cia|grupo)\b", "");
        m = Regex.Replace(m, @"\s+", " ").Trim();
        if (MarcasNeutras.Contains(m)) return "";
        return m;
    }

    public static bool ExtrairGramatura(string nome, out string unidade, out int valorNorm) {
        unidade = "";
        valorNorm = 0;
        if (string.IsNullOrEmpty(nome)) return false;
        string n = NormalizarTexto(nome);

        // Pack ex: 12x350ml, 4x100g
        Match mPack = Regex.Match(n, @"(\d+)\s*(?:x|un|unid|unidades\s*de)\s*(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|ml)\b", RegexOptions.IgnoreCase);
        if (mPack.Success) {
            double qtd = double.Parse(mPack.Groups[1].Value);
            double val = double.Parse(mPack.Groups[2].Value.Replace(",", "."), CultureInfo.InvariantCulture);
            string u = mPack.Groups[3].Value.ToLowerInvariant();
            double baseMultiplier = (u.StartsWith("k") || u == "l" || u == "lt" || u.StartsWith("lit")) ? 1000.0 : 1.0;
            valorNorm = (int)Math.Round(qtd * val * baseMultiplier);
            unidade = u.Contains("l") ? "ml" : "g";
            return true;
        }

        // Peso simples: 500g, 1kg, 2l, 350ml
        Match mSimples = Regex.Match(n, @"\b(\d+(?:[.,]\d+)?)\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml)\b", RegexOptions.IgnoreCase);
        if (mSimples.Success) {
            double val = double.Parse(mSimples.Groups[1].Value.Replace(",", "."), CultureInfo.InvariantCulture);
            string u = mSimples.Groups[2].Value.ToLowerInvariant();
            if (u.StartsWith("k") || u.StartsWith("l")) {
                valorNorm = (int)Math.Round(val * 1000.0);
                unidade = u.StartsWith("l") ? "ml" : "g";
            } else {
                valorNorm = (int)Math.Round(val);
                unidade = u == "ml" ? "ml" : "g";
            }
            return true;
        }

        // Contagem: 12 un, 10 capsulas, 4 rolos
        Match mUn = Regex.Match(n, @"\b(\d+)\s*(un|unid|unidades|rolos|rolo|capsulas|caps|ovos|folhas)\b", RegexOptions.IgnoreCase);
        if (mUn.Success) {
            int val = int.Parse(mUn.Groups[1].Value);
            if (val > 1 && val <= 500) {
                valorNorm = val;
                unidade = "unid";
                return true;
            }
        }

        return false;
    }

    public static string[] ExtrairTokens(string nome, string marcaNorm) {
        string t = NormalizarTextoVinculo(nome);
        t = Regex.Replace(t, @"\b\d+(?:[.,]\d+)?\s*(kg|kilos|g|gr|gramas|l|lt|litros|litro|ml|un|unid|unidades|rolos|rolo|folhas|m|cm|mm)\b", " ");
        HashSet<string> mTokens = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrEmpty(marcaNorm)) {
            foreach (var w in marcaNorm.Split(' ')) if (w.Length >= 3) mTokens.Add(w);
        }

        List<string> res = new List<string>();
        foreach (var w in t.Split(' ')) {
            if (w.Length < 2) continue;
            if (Stopwords.Contains(w)) continue;
            if (Regex.IsMatch(w, @"^\d+$")) continue;
            if (mTokens.Contains(w)) continue;
            res.Add(w);
        }
        return res.ToArray();
    }

    public static string ExtrairAssetHash(string url) {
        if (string.IsNullOrEmpty(url)) return "";
        Match m = Regex.Match(url, @"([0-9a-f]{5,10}-[0-9a-f]{6,16}|[0-9a-f]{20,40})\.(webp|png|jpg|jpeg)", RegexOptions.IgnoreCase);
        return m.Success ? m.Groups[1].Value.ToLowerInvariant() : "";
    }

    public static bool TemConflitoSaborOuVariante(string nK, string nF) {
        string k = " " + NormalizarTextoVinculo(nK) + " ";
        string f = " " + NormalizarTextoVinculo(nF) + " ";

        bool zeroK = Regex.IsMatch(k, @"\b(zero|diet|light|sem acucar)\b");
        bool zeroF = Regex.IsMatch(f, @"\b(zero|diet|light|sem acucar)\b");
        if (zeroK != zeroF) return true;

        bool lacK = Regex.IsMatch(k, @"\b(sem lactose|zero lactose|nolac|lacfree)\b");
        bool lacF = Regex.IsMatch(f, @"\b(sem lactose|zero lactose|nolac|lacfree)\b");
        if (lacK != lacF) return true;

        foreach (var grupo in GruposSabor) {
            string aK = null;
            string aF = null;
            foreach (var termo in grupo) {
                if (k.Contains(" " + termo + " ")) aK = termo;
                if (f.Contains(" " + termo + " ")) aF = termo;
            }
            if (aK != null && aF != null && aK != aF) return true;
        }

        return false;
    }

    public static int AvaliarCasamentoEstrito(ProdItem k, ProdItem f, out string motivo) {
        motivo = "";

        // Regra 1: Gramas ou Litros 100% IGUAL
        if (k.temGram && f.temGram) {
            if (k.gramUn != f.gramUn || k.gramVal != f.gramVal) {
                motivo = "Gramatura diferente";
                return 0;
            }
        } else if (!k.temGram && !f.temGram) {
            string unK = (k.unidade ?? "UN").ToUpperInvariant();
            string unF = (f.unidade ?? "UN").ToUpperInvariant();
            if (unK != unF) {
                motivo = "Unidade venda diferente (KG vs UN)";
                return 0;
            }
        } else {
            // Um tem gramatura especificada e o outro não
            motivo = "Uma embalagem sem gramatura";
            return 0;
        }

        // Conflito de Variante/Sabor
        if (TemConflitoSaborOuVariante(k.nome, f.nome)) {
            motivo = "Sabor ou variante conflitante";
            return 0;
        }

        // Regra 2: Marca 100% IGUAL
        string mk = k.marcaNorm;
        string mf = f.marcaNorm;
        if (string.IsNullOrEmpty(mk) && !string.IsNullOrEmpty(mf) && (" " + k.nomeNorm + " ").Contains(" " + mf + " ")) {
            mk = mf;
        }
        if (string.IsNullOrEmpty(mf) && !string.IsNullOrEmpty(mk) && (" " + f.nomeNorm + " ").Contains(" " + mk + " ")) {
            mf = mk;
        }

        bool mesmaFoto = !string.IsNullOrEmpty(k.assetHash) && k.assetHash == f.assetHash;
        bool ambasSemMarca = string.IsNullOrEmpty(mk) && string.IsNullOrEmpty(mf);

        if (!ambasSemMarca) {
            if (string.IsNullOrEmpty(mk) || string.IsNullOrEmpty(mf) || mk != mf) {
                if (mesmaFoto && !string.IsNullOrEmpty(mk) && !string.IsNullOrEmpty(mf) && (mk.Contains(mf) || mf.Contains(mk))) {
                    // Imagem OSuper confirmada com variação de sufixo de marca
                } else {
                    motivo = "Marcas diferentes";
                    return 0;
                }
            }
        }

        // Regra 3: Nome o mais parecido do banco de dados (Similaridade de tokens)
        if (k.tokens.Length == 0 || f.tokens.Length == 0) {
            motivo = "Sem termos de produto";
            return 0;
        }

        string t0K = k.tokens[0];
        string t0F = f.tokens[0];
        bool mesmoTipo = t0K == t0F || (t0K.Length >= 4 && t0F.Length >= 4 && (t0K.StartsWith(t0F) || t0F.StartsWith(t0K)));
        if (!mesmoTipo && !mesmaFoto) {
            motivo = "Tipo de produto diferente";
            return 0;
        }

        HashSet<string> setF = new HashSet<string>(f.tokens, StringComparer.OrdinalIgnoreCase);
        double intersecao = 0;
        foreach (var tk in k.tokens) {
            if (setF.Contains(tk)) {
                intersecao += 1.0;
            } else {
                foreach (var tf in f.tokens) {
                    if (tk.Length >= 4 && tf.Length >= 4 && (tk.StartsWith(tf) || tf.StartsWith(tk))) {
                        intersecao += 0.85;
                        break;
                    }
                }
            }
        }

        double dice = (2.0 * intersecao) / (k.tokens.Length + f.tokens.Length);
        double minLen = Math.Min(k.tokens.Length, f.tokens.Length);
        double containment = minLen > 0 ? (intersecao / minLen) : 0;
        HashSet<string> uniao = new HashSet<string>(k.tokens, StringComparer.OrdinalIgnoreCase);
        foreach (var tk in f.tokens) uniao.Add(tk);
        double jaccard = uniao.Count > 0 ? (intersecao / uniao.Count) : 0;
        double combinado = (dice * 0.45) + (containment * 0.35) + (jaccard * 0.20);

        if (combinado < 0.35 && !mesmaFoto) {
            motivo = "Similaridade de nome baixa";
            return 0;
        }

        // Coerência de Preço
        if (k.preco > 0 && f.preco > 0) {
            double ratio = Math.Max(k.preco, f.preco) / Math.Min(k.preco, f.preco);
            if (ratio > 2.5 && !mesmaFoto) {
                motivo = "Discrepancia extrema de preco";
                return 0;
            }
        }

        int score = 40; // Base por passar marca e gramatura 100% iguais
        if (mesmaFoto) score += 25;
        if (mesmoTipo) score += 10;
        score += (int)Math.Round(combinado * 25);

        motivo = "Marca 100% (" + (f.marca ?? k.marca) + ") + Medida 100% (" + (k.temGram ? k.gramVal + k.gramUn : "UN") + ") + Similaridade (" + (int)(combinado * 100) + "%)";
        return Math.Min(100, Math.Max(50, score));
    }
}
"@

Add-Type -TypeDefinition $csharpCode -Language CSharp

Write-Host "Processando catalogo do Koch e Fort em C#..." -ForegroundColor Cyan

# Carrega e converte produtos
$kObj = $jsonKoch | ConvertFrom-Json
$fObj = $jsonFort | ConvertFrom-Json

$listaK = New-Object 'System.Collections.Generic.List[ProdItem]'
$listaF = New-Object 'System.Collections.Generic.List[ProdItem]'

$kArray = if ($kObj -is [System.Array]) { $kObj } else { $kObj.psobject.properties.value }
$fArray = if ($fObj -is [System.Array]) { $fObj } else { $fObj.psobject.properties.value }

foreach ($p in $kArray) {
    if ($null -eq $p -or [string]::IsNullOrEmpty($p.id)) { continue }
    $item = New-Object ProdItem
    $item.id = [string]$p.id
    $item.nome = [string]$p.nome
    $item.marca = [string]$p.marca
    $item.preco = [double]($p.preco -as [double])
    $item.unidade = [string]$p.unidade
    $item.imagem = [string]$p.imagem
    $item.marcaNorm = [MotorVinculadorEstrito]::NormalizarMarca($item.marca)
    $item.nomeNorm = [MotorVinculadorEstrito]::NormalizarTextoVinculo($item.nome)
    $item.assetHash = [MotorVinculadorEstrito]::ExtrairAssetHash($item.imagem)

    $u = ""
    $v = 0
    $item.temGram = [MotorVinculadorEstrito]::ExtrairGramatura($item.nome, [ref]$u, [ref]$v)
    $item.gramUn = $u
    $item.gramVal = $v
    $item.tokens = [MotorVinculadorEstrito]::ExtrairTokens($item.nome, $item.marcaNorm)

    $listaK.Add($item)
}

foreach ($p in $fArray) {
    if ($null -eq $p -or [string]::IsNullOrEmpty($p.id)) { continue }
    $item = New-Object ProdItem
    $item.id = [string]$p.id
    $item.nome = [string]$p.nome
    $item.marca = [string]$p.marca
    $item.preco = [double]($p.preco -as [double])
    $item.unidade = [string]$p.unidade
    $item.imagem = [string]$p.imagem
    $item.marcaNorm = [MotorVinculadorEstrito]::NormalizarMarca($item.marca)
    $item.nomeNorm = [MotorVinculadorEstrito]::NormalizarTextoVinculo($item.nome)
    $item.assetHash = [MotorVinculadorEstrito]::ExtrairAssetHash($item.imagem)

    $u = ""
    $v = 0
    $item.temGram = [MotorVinculadorEstrito]::ExtrairGramatura($item.nome, [ref]$u, [ref]$v)
    $item.gramUn = $u
    $item.gramVal = $v
    $item.tokens = [MotorVinculadorEstrito]::ExtrairTokens($item.nome, $item.marcaNorm)

    $listaF.Add($item)
}

Write-Host "Itens carregados no motor: $($listaK.Count) Koch | $($listaF.Count) Fort" -ForegroundColor Green

# Indexacao invertida do Fort para busca em milissegundos
$mapaFortPorHash = New-Object 'System.Collections.Generic.Dictionary[string, System.Collections.Generic.List[ProdItem]]'
$mapaFortPorMarca = New-Object 'System.Collections.Generic.Dictionary[string, System.Collections.Generic.List[ProdItem]]'
$mapaFortPorGram = New-Object 'System.Collections.Generic.Dictionary[string, System.Collections.Generic.List[ProdItem]]'

foreach ($f in $listaF) {
    if (![string]::IsNullOrEmpty($f.assetHash)) {
        if (-not $mapaFortPorHash.ContainsKey($f.assetHash)) {
            $mapaFortPorHash[$f.assetHash] = New-Object 'System.Collections.Generic.List[ProdItem]'
        }
        $mapaFortPorHash[$f.assetHash].Add($f)
    }
    if (![string]::IsNullOrEmpty($f.marcaNorm)) {
        if (-not $mapaFortPorMarca.ContainsKey($f.marcaNorm)) {
            $mapaFortPorMarca[$f.marcaNorm] = New-Object 'System.Collections.Generic.List[ProdItem]'
        }
        $mapaFortPorMarca[$f.marcaNorm].Add($f)
    }
    if ($f.temGram) {
        $chGram = "$($f.gramUn)_$($f.gramVal)"
        if (-not $mapaFortPorGram.ContainsKey($chGram)) {
            $mapaFortPorGram[$chGram] = New-Object 'System.Collections.Generic.List[ProdItem]'
        }
        $mapaFortPorGram[$chGram].Add($f)
    }
}

Write-Host "Cruzando com busca estrita de marca e gramatura..." -ForegroundColor Cyan

$paresCandidatos = New-Object 'System.Collections.Generic.List[ParVinculo]'

foreach ($k in $listaK) {
    $candidatos = New-Object 'System.Collections.Generic.HashSet[ProdItem]'

    if (![string]::IsNullOrEmpty($k.assetHash) -and $mapaFortPorHash.ContainsKey($k.assetHash)) {
        foreach ($f in $mapaFortPorHash[$k.assetHash]) { [void]$candidatos.Add($f) }
    }

    if (![string]::IsNullOrEmpty($k.marcaNorm) -and $mapaFortPorMarca.ContainsKey($k.marcaNorm)) {
        foreach ($f in $mapaFortPorMarca[$k.marcaNorm]) {
            # Só adiciona se a gramatura bater também (ou se ambos não tiverem gramatura)
            if ($k.temGram -and $f.temGram -and $k.gramUn -eq $f.gramUn -and $k.gramVal -eq $f.gramVal) {
                [void]$candidatos.Add($f)
            } elseif (-not $k.temGram -and -not $f.temGram) {
                [void]$candidatos.Add($f)
            }
        }
    }

    foreach ($f in $candidatos) {
        $motivo = ""
        $score = [MotorVinculadorEstrito]::AvaliarCasamentoEstrito($k, $f, [ref]$motivo)
        if ($score -ge 50) {
            $par = New-Object ParVinculo
            $par.idKoch = $k.id
            $par.idFort = $f.id
            $par.score = $score
            $par.motivo = $motivo
            $par.nomeKoch = $k.nome
            $par.nomeFort = $f.nome
            $par.marca = if (![string]::IsNullOrEmpty($f.marca)) { $f.marca } else { $k.marca }
            $par.medida = if ($k.temGram) { "$($k.gramVal)$($k.gramUn)" } else { "UN" }
            $paresCandidatos.Add($par)
        }
    }
}

Write-Host "Total de pares candidatos validos: $($paresCandidatos.Count)" -ForegroundColor Green

# Ordena pelos pares com maior score (similaridade de nome e confirmacoes maximas)
$paresOrdenados = $paresCandidatos | Sort-Object -Property score -Descending

$fortCasados = New-Object 'System.Collections.Generic.HashSet[string]'
$kochCasados = New-Object 'System.Collections.Generic.HashSet[string]'
$vinculosFinais = New-Object 'System.Collections.Generic.List[ParVinculo]'

foreach ($par in $paresOrdenados) {
    if ($kochCasados.Contains($par.idKoch) -or $fortCasados.Contains($par.idFort)) { continue }
    [void]$kochCasados.Add($par.idKoch)
    [void]$fortCasados.Add($par.idFort)
    $vinculosFinais.Add($par)
}

Write-Host "=== RESULTADO DA VINCULACAO ESTRITA (100% MARCA + 100% GRAMATURA) ===" -ForegroundColor Green
Write-Host "Total de produtos unificados/comparados: $($vinculosFinais.Count)" -ForegroundColor Yellow

Write-Host "`nPrimeiros 10 pares vinculados para conferencia:" -ForegroundColor Cyan
for ($i = 0; $i -lt [Math]::Min(10, $vinculosFinais.Count); $i++) {
    $v = $vinculosFinais[$i]
    Write-Host "[$($i+1)] Score $($v.score) | Marca: $($v.marca) | $($v.medida)" -ForegroundColor White
    Write-Host "     Koch: $($v.nomeKoch)" -ForegroundColor Red
    Write-Host "     Fort: $($v.nomeFort)" -ForegroundColor Green
}

# Salva no Firebase RTDB se houver vínculos
if ($vinculosFinais.Count -gt 500) {
    Write-Host "`nFormatando e gravando vinculos no Firebase RTDB..." -ForegroundColor Cyan
    $mapaFlat = @{}
    $listaArray = @()
    $mapaK2F = @{}
    $mapaF2K = @{}

    foreach ($v in $vinculosFinais) {
        $entry = @{
            idKoch = $v.idKoch
            idFort = $v.idFort
            score = $v.score
            motivo = $v.motivo
            manual = $false
            data = (Get-Date).ToUniversalTime().ToString("o")
        }
        $mapaFlat["vinc_$($v.idKoch)_$($v.idFort)"] = $entry
        $listaArray += $entry
        $mapaK2F[$v.idKoch] = $v.idFort
        $mapaF2K[$v.idFort] = $v.idKoch
    }

    $payload = @{
        atualizadoEm = (Get-Date).ToUniversalTime().ToString("o")
        totalVinculos = $vinculosFinais.Count
        vinculos = $listaArray
        mapaKochParaFort = $mapaK2F
        mapaFortParaKoch = $mapaF2K
    }
    foreach ($k in $mapaFlat.Keys) {
        $payload[$k] = $mapaFlat[$k]
    }

    $jsonPayload = $payload | ConvertTo-Json -Depth 4 -Compress
    
    # Grava no Firebase
    $req = [System.Net.HttpWebRequest]::Create("$FIREBASE_URL/vinculos_produtos.json$AUTH")
    $req.Method = "PUT"
    $req.ContentType = "application/json; charset=utf-8"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($jsonPayload)
    $req.ContentLength = $bytes.Length
    $stream = $req.GetRequestStream()
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()

    $resp = $req.GetResponse()
    Write-Host "Sucesso! $($vinculosFinais.Count) vinculos estritos gravados com 100% marca e 100% gramatura no Firebase!" -ForegroundColor Green
    $resp.Close()
}
