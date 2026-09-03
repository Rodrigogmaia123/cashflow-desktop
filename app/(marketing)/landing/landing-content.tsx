import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import { LandingEffects } from "./landing-effects";
import { PlansSection } from "./plans-section";
import { HeroShot, ProductShots } from "./product-shots";
import "../landing.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-lp-display",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lp-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-lp-mono",
});

const TICKER = [
  "DADOS 100% LOCAIS",
  "ATIVAÇÃO POR SERIAL KEY",
  "ROI POR OFERTA",
  "ALERTA DE ORÇAMENTO",
  "MULTI-BANCO",
  "SEM MENSALIDADE",
];

const BANKS = [
  "Nubank",
  "Inter",
  "C6 Bank",
  "Itaú",
  "Bradesco",
  "Banco do Brasil",
  "Caixa",
  "Santander",
  "PicPay",
  "Mercado Pago",
  "PagBank",
];

const DOR = [
  "Não saber o saldo real depois de ads, taxa e despesa.",
  "Planilha que quebra, duplica e ninguém atualiza.",
  "Misturar casa, empresa e dinheiro da oferta no mesmo extrato.",
  "Ferramenta de anúncio que mostra o gasto, mas não o caixa.",
  "Deixar a vida financeira inteira num site de terceiro.",
  "Orçamento que só aparece quando já estourou.",
  "Conta fixa — aluguel, ferramenta, assinatura — que esquece de lançar.",
  "Precisar do mesmo controle em duas máquinas, sem abrir duas contas na nuvem.",
];

const faqs = [
  {
    q: "Meus dados vão para a nuvem?",
    a: "Não. O caixa, as ofertas e os lançamentos ficam no seu computador. O site só cuida de pagamento, serial e download.",
  },
  {
    q: "E se eu usar em dois PCs?",
    a: "A licença é de uma cópia do programa. No pendrive, você leva essa cópia e usa nas suas máquinas. Instalar de forma separada em dois computadores ao mesmo tempo não faz parte do modelo.",
  },
  {
    q: "O prazo começa quando eu pago?",
    a: "Não. Começa quando você ativa o serial dentro do app.",
  },
  {
    q: "Precisa de internet?",
    a: "Para pagar, baixar e ativar, sim. Para o dia a dia, o programa roda no seu PC — de tempos em tempos ele só confirma se a chave ainda vale.",
  },
  {
    q: "É mensalidade?",
    a: "Não. Você paga um prazo uma vez, recebe a chave e usa a partir da ativação. 3 meses está à venda por R$ 30; os outros prazos entram quando o preço existir.",
  },
  {
    q: "E quando acabar os 3 meses?",
    a: "Compra de novo, recebe outro serial e ativa novamente.",
  },
  {
    q: "Posso mandar o instalador para um sócio?",
    a: "O instalador sem a chave dele não abre. Cada pessoa precisa da própria licença.",
  },
  {
    q: "É para celular?",
    a: "É um programa para computador. Não há versão para celular.",
  },
  {
    q: "Substitui o banco ou o gerenciador de anúncios?",
    a: "Não. O Cashflow organiza o que você lança: caixa, orçamento e, na edição Pro, o resultado da oferta depois da taxa.",
  },
];

function IconEye() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconFlow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <path d="M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function LandingContent() {
  const ticker = [...TICKER, ...TICKER];
  const banks = [...BANKS, ...BANKS];

  return (
    <div className={`lp ${display.variable} ${sans.variable} ${mono.variable}`}>
      <LandingEffects />
      <div className="bg-fx" aria-hidden>
        <div className="blob blob-lime" />
        <div className="blob blob-violet" />
        <div className="blob blob-lime2" />
      </div>
      <div className="grain" aria-hidden />

      <header>
        <div className="nav">
          <a href="/" className="brand">
            <span className="brand-mark" />
            Cashflow
          </a>
          <nav className="nav-links">
            <a href="#produto">O PRODUTO</a>
            <a href="#telas">TELAS</a>
            <a href="#como-funciona">COMO FUNCIONA</a>
            <a href="#planos">PLANO</a>
            <a href="#faq">DÚVIDAS</a>
          </nav>
          <a href="#planos" className="btn btn-primary">
            Comprar 3 meses
          </a>
        </div>
        <div className="ticker">
          <div className="ticker-track">
            {ticker.map((item, index) => (
              <span key={`${item}-${index}`}>
                <b>●</b> {item}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="reveal">
              <div className="eyebrow-pill glass">
                <span className="dot" />
                CASHFLOW PRO + PESSOAL
              </div>
              <h1>
                Seu caixa não mora num site.
                <br />
                Mora no seu computador.
              </h1>
              <p className="lead">
                Cashflow é um programa para Windows: você vê o que entra, o que
                sai e o que sobra — na empresa e na vida pessoal. Os dados
                ficam salvos no seu PC, não numa conta na nuvem.
              </p>
              <div className="hero-cta">
                <a href="#planos" className="btn btn-primary">
                  Comprar 3 meses — R$ 30
                </a>
                <a href="#produto" className="btn btn-ghost">
                  Ver o que está incluso
                </a>
              </div>
              <div className="hero-stats">
                <div className="hstat">
                  <b data-countup="100">0</b>
                  <span>% LOCAL, SEM NUVEM</span>
                </div>
                <div className="hstat">
                  <b data-countup="0" data-prefix="R$ ">
                    R$ 0
                  </b>
                  <span>MENSALIDADE</span>
                </div>
                <div className="hstat">
                  <b data-countup="5">0</b>
                  <span>MIN PARA ATIVAR</span>
                </div>
              </div>
            </div>

            <div className="hero-visual reveal">
              <div className="hero-glow" />
              <HeroShot />
              <div className="badge-float glass">
                <IconLock />
                Salvo localmente
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">PARA QUEM É</div>
              <h2>Um programa, duas edições</h2>
              <p>
                Cashflow Pro e Cashflow Pessoal resolvem duas dores diferentes.
                As duas saem por R$ 30 nos primeiros 3 meses.
              </p>
            </div>
            <div className="audience-grid reveal">
              <div className="aud-card pro glass">
                <div className="edition mono">CASHFLOW PRO</div>
                <h3>Para quem vende e anuncia</h3>
                <ul>
                  <li>
                    Infoprodutor, afiliado, gestor de tráfego, dono de oferta
                  </li>
                  <li>
                    PJ ou MEI que mistura anúncio, taxa de gateway e despesa
                    fixa
                  </li>
                  <li>
                    Quem hoje vive de planilha e não confia no lucro que o
                    gerenciador de ads mostra
                  </li>
                </ul>
                <p className="aud-quote">
                  &ldquo;Tive venda, gastei em ads, paguei taxa — e não sei se
                  sobrou.&rdquo;
                </p>
              </div>
              <div className="aud-card pessoal glass">
                <div className="edition mono">CASHFLOW PESSOAL</div>
                <h3>Para quem controla o dia a dia</h3>
                <ul>
                  <li>Quer controlar salário, Pix, cartão e contas do mês</li>
                  <li>
                    Quer orçamento por categoria, com alerta antes de estourar
                  </li>
                  <li>
                    Prefere um programa no PC em vez de um app que sobe o
                    extrato para a nuvem
                  </li>
                </ul>
                <p className="aud-quote">
                  &ldquo;O dinheiro some e eu só vejo no fim do mês.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">O PROBLEMA</div>
              <h2>Não é falta de disciplina</h2>
              <p>É falta de um lugar único e confiável para ver o dinheiro.</p>
            </div>
            <div className="dor-grid reveal">
              {DOR.map((item) => (
                <div key={item} className="dor-item glass">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="produto">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">O PRODUTO</div>
              <h2>O que o Cashflow faz</h2>
              <p>
                Quatro peças que já resolvem o essencial — sem inflar o
                programa de módulo que você não vai usar.
              </p>
            </div>
            <div className="bento reveal">
              <div className="feat-card span2 glass">
                <div className="icon-box lime">
                  <IconEye />
                </div>
                <h3>Abre o programa, já sabe onde está</h3>
                <p className="benefit">
                  Painel do período com receita, despesa e lucro líquido — e o
                  ROI, se você usa o Pro. Saúde do caixa em três estados:
                  saudável, atenção ou risco.
                </p>
                <ul>
                  <li>Resumo e destaques do período</li>
                  <li>Próximos passos quando falta cadastrar o básico</li>
                </ul>
              </div>
              <div className="feat-card glass">
                <div className="icon-box violet">
                  <IconFlow />
                </div>
                <h3>Lança o que entrou e saiu</h3>
                <p className="benefit">
                  Pix, crédito, débito ou dinheiro — de qualquer banco: Nubank,
                  Inter, C6, Itaú, Bradesco, BB, Caixa, Santander e outros.
                </p>
                <ul>
                  <li>Despesas avulsas e recorrentes</li>
                  <li>Captura rápida, sem percorrer menu</li>
                </ul>
              </div>
              <div className="feat-card glass">
                <div className="icon-box lime">
                  <IconChart />
                </div>
                <div className="feat-tag">OFERTAS &amp; ROI · PRO</div>
                <h3>O que sobrou depois da taxa</h3>
                <p className="benefit">
                  Cruza investimento, receita, taxa de checkout e imposto — e
                  mostra o lucro real de cada oferta, em BR, US, AR, MX e CO.
                </p>
              </div>
              <div className="feat-card glass">
                <div className="icon-box violet">
                  <IconBell />
                </div>
                <h3>Avisa antes de estourar</h3>
                <p className="benefit">
                  Teto por categoria, com aviso em 75%, 90% e 100% do limite.
                  Projetos separados do caixa do dia — reforma, estoque,
                  viagem.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="telas">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">POR DENTRO</div>
              <h2>É isso que você vê depois de instalar</h2>
              <p>
                Prints reais do programa. Os nomes são de demonstração — os
                números, do uso de verdade.
              </p>
            </div>
            <div className="reveal">
              <ProductShots />
            </div>
            <div className="bank-ticker glass reveal">
              <div className="bank-track">
                {banks.map((bank, index) => (
                  <span key={`${bank}-${index}`} className="bank-chip">
                    {bank}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">COMO FUNCIONA</div>
              <h2>Cinco passos até estar usando</h2>
              <p>Sem conta grátis. Você compra 3 meses e recebe uma chave.</p>
            </div>
            <div className="steps reveal">
              <div className="step">
                <div className="step-num">01</div>
                <div>
                  <h3>Escolhe o prazo e paga</h3>
                  <p>
                    3 meses, 5 meses, anual ou vitalício — Pro ou Pessoal. O
                    serial só nasce se o pagamento passar.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">02</div>
                <div>
                  <h3>Paga no Stripe</h3>
                  <p>Cartão, checkout seguro.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">03</div>
                <div>
                  <h3>Recebe o serial</h3>
                  <p>
                    Por e-mail e na tela de pagamento aprovado, junto com o
                    instalador.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">04</div>
                <div>
                  <h3>Instala e cola a chave</h3>
                  <p>
                    O programa pede o Serial Key na primeira abertura. Dá para
                    usar direto de um pendrive, se preferir.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">05</div>
                <div>
                  <h3>Usa no PC</h3>
                  <p>
                    O prazo da licença começa no dia em que você ativa — não no
                    dia em que pagou. Depois disso o dia a dia é local; de
                    tempos em tempos o app só confirma se a chave ainda vale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PlansSection />

        <section>
          <div className="wrap">
            <div className="priv-band glass reveal">
              <div className="priv-icon">
                <IconLock />
              </div>
              <div>
                <h3>
                  O sistema fica no seu PC. O site só vende e libera a chave.
                </h3>
                <p>
                  O caixa, as ofertas e os lançamentos são salvos no seu
                  computador — não numa conta nossa na nuvem. A internet entra
                  só para pagar, baixar e, de tempos em tempos, confirmar se a
                  licença ainda vale.
                </p>
              </div>
              <a href="#planos" className="btn btn-primary">
                Comprar 3 meses
              </a>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">DÚVIDAS</div>
              <h2>Tudo que você quer saber</h2>
            </div>
            <div className="faq reveal">
              {faqs.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="cta-final glass reveal">
              <div className="cta-glow" />
              <div className="cta-copy">
                <h2>Pague R$ 30. Receba a chave. Ative quando for usar.</h2>
                <p>
                  Sem conta grátis, sem cartão preso a assinatura. Você compra 3
                  meses, recebe o serial por e-mail e o instalador junto — o
                  tempo só começa a contar quando você ativa.
                </p>
              </div>
              <a href="#planos" className="btn btn-primary">
                Comprar 3 meses — R$ 30
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="foot-watermark">CASHFLOW</div>
        <div className="wrap foot-grid">
          <div>Nexpay Vendas Online LTDA · CNPJ 44.681.882/0001-73</div>
          <div className="foot-links">
            <a href="#faq">Dúvidas</a>
            <a href="#planos">Plano</a>
            <a href="#telas">Telas</a>
            <a href="#produto">O produto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
