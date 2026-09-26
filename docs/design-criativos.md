# Design de criativos — Cashflow

Especificação visual para estático, carrossel, stories, reels e end card.  
Mensagem e ângulos ficam em `docs/briefing-criativos.md`.

O criativo segue a landing atual: fundo escuro, acento verde-lima, violeta só como detalhe. Não usar o tema violeta “SaaS antigo” como cor principal.

---

## 1. Cores

| Token | Hex | Uso |
|---|---|---|
| Fundo | `#0a0f0c` | Fundo do criativo |
| Fundo 2 | `#0d1612` | Variação / degradê |
| Superfície | `#121c17` | Cards, moldura da tela |
| Superfície 2 | `#16221c` | Card interno |
| Texto | `#f3f7f4` | Headline |
| Muted | `#9ca9a1` | Subtexto |
| Dim | `#64706a` | Kicker, legenda secundária |
| Borda | `rgba(234, 240, 236, 0.1)` | Contorno glass |
| Lime | `#c7f156` | CTA, preço, underline, badge |
| Lime 2 | `#8fcb2e` | Segundo acento |
| Violeta | `#ac93ff` | Tag PRO, glow, detalhe |
| Violeta 2 | `#7a57f0` | Glow secundário |
| Ok | `#8fd37a` | Lucro / positivo |
| Warn | `#e4c15c` | Alerta de orçamento |
| Texto no botão | `#0a0f0c` | Sempre texto escuro em cima do lime |

Glow sugerido (não obrigatório):

- Lime: `0 0 60px -12px rgba(199, 241, 86, 0.55)`
- Violeta: `0 0 60px -12px rgba(172, 147, 255, 0.55)`

Glass: degradê leve `rgba(255,255,255,0.045)` → `rgba(255,255,255,0.015)`, borda 1px, raio **16px**.

**Regra do botão:** fundo `#c7f156`, texto `#0a0f0c`, peso 600. Nunca texto branco em cima do lime.

---

## 2. Tipografia

| Papel | Família | Peso |
|---|---|---|
| Headline | Space Grotesk | 600 ou 700 |
| Corpo | IBM Plex Sans | 400 / 500 |
| Preço, kicker, serial, tag de edição | IBM Plex Mono | 400 ou 500 |

Arquivos no repo: `app/(marketing)/fonts/`.

Headline com tracking levemente negativo (`-0.01em`), como na LP. Kicker em mono, caixa alta, cor muted ou lime: `CASHFLOW PRO`, `CASHFLOW PESSOAL`, `3 MESES`.

**Tom visual da letra:** frases curtas, segunda pessoa, sem guru. Sem emoji no estático. No texto do anúncio, no máximo um.

---

## 3. Logo e marca

- Ícone: `public/brand/cashflow-icon.png`
- Wordmark: **Cashflow** (Space Grotesk). Sem “Pro” no logo quando o anúncio for da edição Pessoal.
- Badge de edição, separado do logo, em mono: `CASHFLOW PRO` ou `CASHFLOW PESSOAL`.
- Pro pode usar um filete ou ponto violeta. Pessoal usa lime.
- Não colocar logo de banco, Meta, Google, Hotmart ou Stripe como selo de parceria.

---

## 4. Moldura do produto

Janela tipo app:

- Barra superior escura (`#121c17`)
- Três pontos discretos
- Título em mono, minúsculo: `fluxo de caixa · cards`, `ofertas · ROI`
- Print dentro, sem distorcer
- Borda glass + glow lime suave atrás

Números das prints são de demonstração. Se o criativo destacar um valor da tela, a legenda diz **tela do programa** — não vender aquele número como resultado de quem anuncia.

---

## 5. Prints prontos

Pasta: `public/images/lp/`

| Arquivo | O que mostra | Onde usar |
|---|---|---|
| `cashflow-cards.png` | Lucro, receita, saída, projeção | Hero de caixa, ambas as edições |
| `cashflow-chart.png` | Evolução do mês | Prova visual |
| `offers.png` | ROI e faturamento por oferta | **Só Pro** |
| `plans.png` | Projetos: planejado vs pago | Teto / projeto |
| `cashflow-expenses.png` | Lançamentos, categoria, Pix/cartão | Pessoal e “você lança” |

Recorte novo: capturar o app em 1920×1080, depois enquadrar 1:1 e 9:16. Não esticar.

Não usar: print do painel admin, tela de serial vazada, fluxo de tester, mock genérico de dashboard SaaS.

---

## 6. Formatos

| Canal | Proporção | Tamanho | O que entra |
|---|---|---|---|
| Feed Meta | 1:1 | 1080×1080 | Print + headline + preço |
| Stories / Reels / TikTok | 9:16 | 1080×1920 | Demo + texto no miolo |
| YouTube / in-stream | 16:9 | 1920×1080 | Demo + end card de 5s |
| Google Demand Gen | 1.91:1 e 1:1 | 1200×628 e 1080×1080 | Headline curta + print |
| Carrossel Meta | 1:1 | 1080×1080 × 4–5 | 1 problema + 3 telas + oferta |

**Zona segura 9:16:** texto, logo e preço fora dos ~250px de cima e ~350px de baixo (avatar, caption, botão nativo).

**Primeiro frame:** texto legível em 1 segundo. Sem intro de logo de 3 segundos.

**Hierarquia do estático 1:1 (de cima para baixo):**

1. Badge da edição (mono)
2. Headline (2 linhas no máximo)
3. Print na moldura
4. Preço em mono: `3 MESES · R$ 30`
5. Botão lime: `Comprar`

Subtexto opcional, uma linha: `Sem mensalidade · Windows e Mac · dados no PC`.

---

## 7. Composição por ângulo

| Ângulo | Visual dominante | Cor de acento |
|---|---|---|
| Lucro real | Zoom em `offers.png` | Lime no ROI, violeta na tag PRO |
| Gerenciador ≠ caixa | Split: tela de ads borrada / print do Cashflow nítido | Lime só no lado Cashflow |
| Sem nuvem | Print + cadeado “Salvo localmente” | Lime |
| R$ 30 | Preço grande em mono, print menor | Botão lime |
| Alerta de orçamento | `plans.png` ou card de teto | Warn `#e4c15c` só no número do alerta |
| Windows e Mac | Dois chips `Windows` / `macOS`, mesmo estilo da LP | Lime |

Chips de sistema (como a LP): pílula com borda, texto sans, sem logo oficial da Apple ou da Microsoft em tamanho de parceria.

---

## 8. End card (últimos 3–5s do vídeo)

Fundo `#0a0f0c`.

- Wordmark Cashflow
- Linha: `3 meses · R$ 30 · sem mensalidade`
- Botão: `Comprar`
- Linha pequena em muted: `Windows e Mac · chave por e-mail`

Sem URL gigante se a plataforma já mostra o botão. Se precisar de URL, só o domínio.

---

## 9. O que não desenhar

- App de celular, mock de iPhone como produto principal
- Nuvem, cadeado de “banco na nuvem”, Open Finance
- Gráfico de crescimento inventado (seta 300%, “+R$ 50 mil”)
- Depoimento com foto de estoque e estrela sem prova
- Fundo branco clean de fintech genérica
- Gradiente roxo dominante
- Preço de prazo que ainda está “A definir” na LP
- Selos “garantido”, “#1 do Brasil”, “usado por milhares”

---

## 10. Checklist do arquivo final

- [ ] Fundo `#0a0f0c` (ou variação `#0d1612`)
- [ ] Headline em Space Grotesk
- [ ] Preço em IBM Plex Mono
- [ ] Botão lime com texto `#0a0f0c`
- [ ] Edição (Pro ou Pessoal) visível se o print for de ofertas
- [ ] `offers.png` só em peça de Pro
- [ ] Texto fora da zona de UI no 9:16
- [ ] Print sem distorção
- [ ] Export: PNG (estático) ou MP4 H.264 (vídeo), sem marca d’água de editor
