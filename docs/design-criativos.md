# Design de criativos — Cashflow Pro

Especificação visual para estático, carrossel, stories, reels e end card.  
Mensagem em `docs/briefing-criativos.md`.

Há duas peles. A **escura** é a da landing e o padrão do anúncio. A **clara** existe para teste de feed, onde o fundo claro para o scroll. As duas usam o mesmo lime, a mesma tipo e a mesma tela real do programa. Não desenhar uma fintech branca genérica e chamar de versão clara.

O anúncio é Cashflow Pro. Não desenhar badge “Pessoal” nem preço de 3 meses.

---

## 1. Versão escura (padrão)

| Token | Hex | Uso |
|---|---|---|
| Fundo | `#0a0f0c` | Fundo do criativo |
| Fundo 2 | `#0d1612` | Variação / degradê |
| Superfície | `#121c17` | Cards, moldura da tela |
| Superfície 2 | `#16221c` | Card interno |
| Texto | `#f3f7f4` | Headline |
| Muted | `#9ca9a1` | Subtexto |
| Dim | `#64706a` | Kicker |
| Borda | `rgba(234, 240, 236, 0.1)` | Contorno |
| Lime | `#c7f156` | CTA, preço, pílula |
| Lime 2 | `#8fcb2e` | Segundo acento |
| Violeta | `#ac93ff` | Tag PRO, detalhe |
| Violeta 2 | `#7a57f0` | Glow secundário |
| Ok | `#8fd37a` | Lucro na legenda, se precisar recolorir |
| Warn | `#e4c15c` | Alerta, com parcimônia |
| Texto no botão | `#0a0f0c` | Sempre escuro em cima do lime |

Glow: `0 0 60px -12px rgba(199, 241, 86, 0.55)`.  
Glass: `rgba(255,255,255,0.045)` → `rgba(255,255,255,0.015)`, borda 1px, raio **16px**.

Barra da janela do app: `#121c17`.

---

## 2. Versão clara

O miolo continua sendo o print escuro do programa. O que clareia é a moldura em volta: papel, headline e card.

| Token | Hex | Uso |
|---|---|---|
| Fundo | `#f3f6f1` | Papel. Não usar `#ffffff` chapado na peça inteira |
| Fundo 2 | `#e6eee4` | Faixa, verso de card |
| Superfície | `#ffffff` | Card da oferta, moldura |
| Texto | `#14201a` | Headline |
| Muted | `#5c6b63` | Subtexto |
| Dim | `#7d8b84` | Kicker |
| Borda | `rgba(20, 32, 26, 0.12)` | Contorno do card |
| Lime | `#c7f156` | Botão e pílula de preço. Não usar como cor de texto longo |
| Lime texto | `#3f6212` | Kicker, sublinhado e preço quando o fundo é claro |
| Violeta | `#6d28d9` | Tag PRO em fundo claro. O `#ac93ff` some no papel |
| Ok | `#3f7d32` | Número positivo fora do print |
| Warn | `#a16207` | Alerta em fundo claro |
| Texto no botão | `#0a0f0c` | Igual à versão escura |

Sombra do card: `0 16px 40px -24px rgba(20, 32, 26, 0.35)`. Sem glow neon.  
A barra da janela do print pode continuar `#121c17`, porque a tela do produto é escura. Não “clarear” o screenshot no Photoshop.

Pílulas da equação no claro: fundo `#ffffff`, borda `rgba(20, 32, 26, 0.14)`, texto `#3f6212`.

---

## 3. O que as duas versões compartilham

**Botão:** fundo `#c7f156`, texto `#0a0f0c`, peso 600. Nunca texto branco em cima do lime.

**Tipografia**

| Papel | Família | Peso |
|---|---|---|
| Headline | Space Grotesk | 600 ou 700 |
| Corpo | IBM Plex Sans | 400 / 500 |
| Preço, kicker, serial | IBM Plex Mono | 400 ou 500 |

Arquivos: `app/(marketing)/fonts/`. Tracking da headline `-0.01em`.

Kicker em mono, caixa alta: `CASHFLOW PRO`, `12 MESES`, `PAGAMENTO ÚNICO`.

Frases curtas. Sem emoji no estático. No texto do anúncio, no máximo um.

**Logo**

- Ícone: `public/brand/cashflow-icon.png`
- Wordmark: **Cashflow** (Space Grotesk) + badge `CASHFLOW PRO` em mono
- Sem logo de banco, Meta, Google, Hotmart, Stripe ou Apple/Microsoft como selo de parceria

**Moldura do produto**

- Três pontos discretos
- Título em mono: `ofertas · ROI`, `fluxo de caixa · cards`
- Print sem distorcer
- Se o número da tela aparecer grande, a legenda diz **tela do programa**

---

## 4. Prints

Pasta: `public/images/lp/`

| Arquivo | Uso |
|---|---|
| `dashboard-hero.png` | Hero. Investimento, faturamento, taxas, lucro, ROI |
| `visao-geral.png` | Receita, despesa, lucro, saúde do caixa |
| `ofertas.png` | Radar de ROI e cadastro de oferta |
| `oferta.png` | Uma oferta aberta |
| `comparar-ofertas.png` | Comparação entre ofertas |
| `despesas.png` | Saídas, categoria e taxa |
| `investimentos.png` | Entradas e aportes |
| `projetos.png` | Planejado versus pago |
| `orcamentos.png` | Teto por categoria |

Não usar: painel admin, serial vazado, mock de dashboard SaaS, seta de “+300%”.

---

## 5. Formatos

| Canal | Proporção | Tamanho | O que entra |
|---|---|---|---|
| Feed Meta | 1:1 | 1080×1080 | Print + headline + R$ 97 |
| Stories / Reels / TikTok | 9:16 | 1080×1920 | Demo + texto no miolo |
| YouTube | 16:9 | 1920×1080 | Demo + end card de 5s |
| Demand Gen | 1.91:1 e 1:1 | 1200×628 e 1080×1080 | Headline curta + print |
| Carrossel | 1:1 | 1080×1080 × 5 | Buraco, mecanismo, 2 telas, oferta |

**Zona segura 9:16:** texto e preço fora dos ~250px de cima e ~350px de baixo.

**Primeiro frame:** legível em 1 segundo. Sem intro de logo.

**Estático 1:1, de cima para baixo**

1. `CASHFLOW PRO`
2. Headline em até 2 linhas
3. Print na moldura
4. `12 MESES · R$ 97` em mono
5. Botão: `Comprar`

Linha opcional: `Pagamento único · não é mensalidade`.

A versão clara usa a mesma ordem. Só troca o papel e a cor do texto.

---

## 6. Composição por ângulo

| Ângulo | Visual | Acento |
|---|---|---|
| Quanto sobrou | Zoom em `dashboard-hero.png` ou `oferta.png` | Lime no resultado, tag PRO |
| Gerenciador ≠ caixa | Split: ads borrado / Cashflow nítido | Lime só no lado Cashflow |
| A conta | Cinco pílulas numa linha: Receita − Ads − Taxas − Impostos − Despesas | O sinal fica colado na pílula seguinte |
| 12 meses | Preço grande em mono, print menor | Botão lime |
| Sem nuvem | Print + “Salvo no computador” | Fechamento, não a peça de abertura |
| Windows e Mac | Dois chips `Windows` / `macOS` | Sem logo oficial |

No claro, as pílulas não podem usar texto `#c7f156` em cima do papel. Usar texto `#3f6212` ou pílula lime com texto `#0a0f0c`.

---

## 7. End card (3–5s)

**Escuro:** fundo `#0a0f0c`, texto `#f3f7f4`.  
**Claro:** fundo `#f3f6f1`, texto `#14201a`.

Nos dois:

- Wordmark Cashflow
- `12 meses · R$ 97 · pagamento único`
- Botão lime `Comprar`
- Linha pequena: `Windows e Mac · chave por e-mail`

Sem URL gigante se a plataforma já mostra o botão.

---

## 8. O que não desenhar

- App de celular como produto
- Nuvem, Open Finance, cadeado de “banco seguro na nuvem”
- Gráfico inventado, depoimento de banco de imagem, estrela sem prova
- Selos “garantido”, “#1”, “X mil usuários”, contador de escassez
- Gradiente roxo dominante
- Preço de 3 meses ou de Pessoal
- “R$ 8,08/mês” como se fosse assinatura
- Versão clara que seja só um dashboard branco, sem lime e sem a tela real

---

## 9. Checklist

- [ ] Pele declarada no arquivo: `escura` ou `clara`
- [ ] Se clara: papel `#f3f6f1`, texto `#14201a`, kicker `#3f6212`, botão lime com texto `#0a0f0c`
- [ ] Se escura: fundo `#0a0f0c`, texto `#f3f7f4`
- [ ] Headline em Space Grotesk, preço em IBM Plex Mono
- [ ] Preço `12 MESES · R$ 97`
- [ ] Print de oferta só em peça de Pro, sem distorção
- [ ] Texto fora da zona de UI no 9:16
- [ ] PNG ou MP4 H.264, sem marca d’água de editor
