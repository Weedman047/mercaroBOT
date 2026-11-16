$indexContent = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)

# 1. adm.html (Modo ADM)
$admContent = $indexContent.Replace("window.MODO_PAGINA_PADRAO = window.MODO_PAGINA_PADRAO || 'mercado';", "window.MODO_PAGINA_PADRAO = 'adm';")
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText('adm.html', $admContent, $utf8NoBom)
Write-Output "adm.html sincronizado com sucesso!"

# 2. mercado.html (Modo Mercado)
$mercadoContent = $indexContent.Replace("window.MODO_PAGINA_PADRAO = window.MODO_PAGINA_PADRAO || 'mercado';", "window.MODO_PAGINA_PADRAO = 'mercado';")
[System.IO.File]::WriteAllText('mercado.html', $mercadoContent, $utf8NoBom)
Write-Output "mercado.html sincronizado com sucesso!"

# 3. robo.html (Modo Robô)
$roboContent = $indexContent.Replace("window.MODO_PAGINA_PADRAO = window.MODO_PAGINA_PADRAO || 'mercado';", "window.MODO_PAGINA_PADRAO = 'robo';")
[System.IO.File]::WriteAllText('robo.html', $roboContent, $utf8NoBom)
Write-Output "robo.html sincronizado com sucesso!"
