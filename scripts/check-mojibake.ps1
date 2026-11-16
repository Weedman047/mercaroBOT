$text = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8)
$pattern = '[\u00C3][\u0080-\u00BF]|[\u00C2][\u0080-\u00BF]|\u00F0\u009F'
$matches = [regex]::Matches($text, $pattern)
Write-Output "Mojibake matches: $($matches.Count)"
