if (Test-Path .env.example) {
    $content = Get-Content .env.example -Raw
    $content = $content -replace 'sk-proj-[^"]+', 'your-openai-api-key-here'
    Set-Content .env.example -Value $content -NoNewline
}
if (Test-Path start-backend.ps1) {
    $content = Get-Content start-backend.ps1 -Raw
    $content = $content -replace 'sk-proj-[^"]+', 'your-openai-api-key-here'
    Set-Content start-backend.ps1 -Value $content -NoNewline
}

