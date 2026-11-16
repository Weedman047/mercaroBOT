$files = @('index.html', 'adm.html', 'mercado.html', 'robo.html')
$utf8 = [System.Text.Encoding]::UTF8
$pattern = '[\u00C3][\u0080-\u00BF]|[\u00C2][\u0080-\u00BF]|\u00F0\u009F'

foreach ($f in $files) {
    $text = [System.IO.File]::ReadAllText($f, $utf8)
    $m = [regex]::Matches($text, $pattern)
    Write-Output "$f -> Mojibake: $($m.Count)"
}
