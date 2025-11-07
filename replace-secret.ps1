$apiKeyPattern = 'sk-proj-[^"]+'
$replacement = 'your-openai-api-key-here'

if (Test-Path .env.example) {
    $content = Get-Content .env.example -Raw
    if ($content -match $apiKeyPattern) {
        $content = $content -replace $apiKeyPattern, $replacement
        Set-Content .env.example -Value $content -NoNewline
    }
}

if (Test-Path start-backend.ps1) {
    $content = Get-Content start-backend.ps1 -Raw
    if ($content -match $apiKeyPattern) {
        $content = $content -replace $apiKeyPattern, $replacement
        Set-Content start-backend.ps1 -Value $content -NoNewline
    }
}

