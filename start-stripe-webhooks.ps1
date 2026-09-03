# Script para iniciar Stripe CLI para webhooks
# Uso: .\start-stripe-webhooks.ps1

Write-Host ""
Write-Host "🚀 Iniciando Stripe CLI para Webhooks..." -ForegroundColor Cyan
Write-Host ""

# Verificar se Stripe CLI está instalado
if (!(Get-Command stripe -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Stripe CLI não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: scoop install stripe" -ForegroundColor Yellow
    Write-Host "Ou visite: https://stripe.com/docs/stripe-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Stripe CLI encontrado" -ForegroundColor Green
Write-Host ""
Write-Host "🔵 Iniciando listener de webhooks..." -ForegroundColor Cyan
Write-Host "📡 Encaminhando para: http://localhost:3000/api/webhooks/stripe" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   1. Copie o 'webhook signing secret' que aparecer abaixo" -ForegroundColor White
Write-Host "   2. Cole no arquivo .env.local como STRIPE_WEBHOOK_SECRET" -ForegroundColor White
Write-Host "   3. Reinicie o servidor Next.js após atualizar o .env.local" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dica: Deixe este terminal aberto enquanto desenvolve!" -ForegroundColor Cyan
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# Executar stripe listen
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe

