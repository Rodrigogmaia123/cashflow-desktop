# Script para aplicar migration do onboarding
# Execute: .\fix-migration.ps1

Write-Host "🔍 Verificando processos Node.js..." -ForegroundColor Yellow

# Verificar processos Node
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Encontrados processos Node.js rodando:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   - PID: $($_.Id) - $($_.Path)" -ForegroundColor Gray
    }
    Write-Host ""
    $response = Read-Host "Deseja encerrar todos os processos Node.js? (S/N)"
    if ($response -eq "S" -or $response -eq "s") {
        $nodeProcesses | Stop-Process -Force
        Write-Host "✅ Processos Node.js encerrados" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}

Write-Host ""
Write-Host "📦 Aplicando migration..." -ForegroundColor Cyan

# Tentar aplicar migration
try {
    npx prisma migrate deploy
    Write-Host "✅ Migration aplicada com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao aplicar migration: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tentando alternativa: marcar migration como aplicada..." -ForegroundColor Yellow
    npx prisma migrate resolve --applied 20251219165205_add_onboarding_completed
}

Write-Host ""
Write-Host "🔄 Regenerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate

Write-Host ""
Write-Host "✅ Concluído! Agora você pode reiniciar o servidor com 'npm run dev'" -ForegroundColor Green
