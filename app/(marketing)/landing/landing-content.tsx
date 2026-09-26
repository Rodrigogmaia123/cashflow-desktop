import { LandingEffects } from "./landing-effects";
import { display, mono, sans } from "./fonts";
import { PlansSection } from "./plans-section";
import { HeroShot, ProductShots } from "./product-shots";
import { listSellableLicenseOffers } from "@/lib/license/catalog";
import "../landing.css";

const TICKER = [
  "RECEITA − ADS − TAXAS − IMPOSTOS",
  "ROI POR OFERTA",
  "WINDOWS E MAC",
  "DADOS NO SEU COMPUTADOR",
  "PAGAMENTO ÚNICO",
  "12 MESES · R$ 97",
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
  "Saber o faturamento e não saber o que sobrou.",
  "Gerenciador de anúncio que mostra o gasto, mas não o caixa.",
  "Taxa de checkout e imposto fora do ROI.",
  "Planilha que quebra, duplica e ninguém atualiza.",
  "Lucro bonito no painel de ads e vermelho no banco.",
  "Misturar casa, empresa e dinheiro da oferta no mesmo extrato.",
  "Fechar o mês montando conta na mão.",
  "Deixar o caixa da operação num site de terceiro.",
];

function buildFaqs(lifetimeOn: boolean) {
  return [
    {
      q: "Meus dados vão para a nuvem?",
      a: "Não. O caixa, as ofertas e os lançamentos ficam no seu computador. O site só cuida de pagamento, serial e download.",
    },
    {
      q: "E se eu usar em dois computadores?",
      a: "A licença é de uma cópia do programa, no Windows ou no Mac. No pendrive, você leva essa cópia e usa nas suas máquinas. Instalar de forma separada em dois computadores ao mesmo tempo não faz parte do modelo.",
    },
    {
      q: "Tem para Mac?",
      a: "Tem. O mesmo programa sai em instalador Windows (.exe) e Mac (.dmg). A chave é a mesma: você baixa a versão do seu sistema, cola o serial e usa.",
    },
    {
      q: "O prazo começa quando eu pago?",
      a: lifetimeOn
        ? "Nos 12 meses, não. Os 365 dias começam quando você ativa o serial dentro do app. No vitalício não há data de validade — o acesso também começa na ativação."
        : "Não. Os 365 dias começam quando você ativa o serial dentro do app, não no dia do pagamento.",
    },
    {
      q: "Precisa de internet?",
      a: "Para pagar, baixar e ativar, sim. Para o dia a dia, o programa roda no seu Windows ou Mac — de tempos em tempos ele só confirma se a chave ainda vale.",
    },
    {
      q: "Como funciona o PIX?",
      a: "Você informa o e-mail, gera o QR na Pushin Pay e paga. Quando o PIX é confirmado, o serial nasce e vai para esse e-mail — a mesma entrega do cartão. Nos 12 meses, o prazo só começa na ativação.",
    },
    {
      q: "É mensalidade? É R$ 97 por mês?",
      a: lifetimeOn
        ? "Não. 12 meses é R$ 97 uma vez — uma licença de 12 meses, não uma assinatura. O vitalício é R$ 147 uma vez, sem data de validade. Nenhum dos dois cobra de novo todo mês."
        : "Não. 12 meses é R$ 97 uma vez — uma licença de 12 meses, não uma assinatura. Não cobra de novo todo mês.",
    },
    {
      q: "E quando acabar os 12 meses?",
      a: "Compra de novo, recebe outro serial e ativa novamente. Quem já tem uma licença antiga continua nela até o prazo que comprou.",
    },
    {
      q: "Posso mandar o instalador para um sócio?",
      a: "O instalador sem a chave dele não abre. Cada pessoa precisa da própria licença.",
    },
    {
      q: "É para celular?",
      a: "É um programa para computador, no Windows e no Mac. Não há versão para celular.",
    },
    {
      q: "Substitui o banco ou o gerenciador de anúncios?",
      a: "Não. O Cashflow Pro organiza o que você lança: investimento, faturamento, taxas, impostos, despesas e o resultado da oferta.",
    },
    {
      q: "O fechamento do mês é contábil?",
      a: "Não. É a organização da sua operação: receita, despesa, investimento, taxas e resultado do período, com exportação em PDF ou Excel. Não substitui contador nem obrigação fiscal.",
    },
  ];
}

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
  const offers = listSellableLicenseOffers();
  const lifetimeOn = offers.some((item) => item.duration === "lifetime");
  const faqs = buildFaqs(lifetimeOn);

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
            <img src="/brand/cashflow-icon.png" alt="" className="brand-mark" />
            Cashflow
          </a>
          <nav className="nav-links">
            <a href="#produto">O PRODUTO</a>
            <a href="#telas">TELAS</a>
            <a href="#download">BAIXAR</a>
            <a href="#planos">PLANO</a>
            <a href="#faq">DÚVIDAS</a>
          </nav>
          <a href="#planos" className="btn btn-primary">
            Comprar 12 meses
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
                CASHFLOW PRO
              </div>
              <h1>
                Você sabe quanto vendeu.
                <br />
                Mas sabe quanto realmente sobrou?
              </h1>
              <p className="lead">
                Organize investimento em anúncios, faturamento, taxas, impostos
                e despesas para acompanhar o resultado real das suas ofertas.
                Cashflow Pro roda no Windows e no Mac e mantém seus dados no seu
                computador.
              </p>
              <div className="os-row" aria-label="Sistemas disponíveis">
                <span className="os-chip">Windows</span>
                <span className="os-chip">macOS</span>
              </div>
              <div className="hero-cta">
                <a href="#planos" className="btn btn-primary">
                  Comprar 12 meses — R$ 97
                </a>
                <a href="#download" className="btn btn-ghost">
                  Baixar Windows ou Mac
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

        <section id="mecanismo">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">COMO A CONTA FECHA</div>
              <h2>Receita − Ads − Taxas − Impostos − Despesas</h2>
              <p>
                O gerenciador mostra o gasto. O Cashflow Pro junta o que entrou,
                o que foi para anúncio, a taxa, o imposto e a despesa — e mostra
                o que sobrou em cada oferta.
              </p>
            </div>
            <div className="formula reveal" aria-label="Receita menos ads, taxas, impostos e despesas">
              <span className="os-chip">Receita</span>
              <b>−</b>
              <span className="os-chip">Ads</span>
              <b>−</b>
              <span className="os-chip">Taxas</span>
              <b>−</b>
              <span className="os-chip">Impostos</span>
              <b>−</b>
              <span className="os-chip">Despesas</span>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">PARA QUEM É</div>
              <h2>Para quem vive de oferta</h2>
              <p>
                Afiliados, gestores de tráfego, infoprodutores e quem vende
                produto online. A pergunta não é quanto entrou. É quanto ficou.
              </p>
            </div>
            <div className="audience-grid personas reveal">
              <div className="aud-card pro glass">
                <div className="edition mono">AFILIADO</div>
                <h3>A campanha sobrou?</h3>
                <p className="aud-quote">
                  Venda, anúncio e taxa no mesmo lugar — para ver o que restou
                  depois do checkout.
                </p>
              </div>
              <div className="aud-card pro glass">
                <div className="edition mono">GESTOR DE TRÁFEGO</div>
                <h3>Gasto não é resultado</h3>
                <p className="aud-quote">
                  O gerenciador mostra o investimento. O Cashflow Pro mostra o
                  caixa da oferta.
                </p>
              </div>
              <div className="aud-card pro glass">
                <div className="edition mono">INFOPRODUTO</div>
                <h3>Fecha a operação</h3>
                <p className="aud-quote">
                  Faturamento, imposto, taxa e despesa do período, sem montar
                  planilha na mão.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">O PROBLEMA</div>
              <h2>Saiba quanto a operação deixou no caixa</h2>
              <p>Não é falta de número. É falta de uma conta que junte venda, anúncio, taxa, imposto e despesa.</p>
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
              <h2>O que o Cashflow Pro faz</h2>
              <p>
                Receita, anúncio, taxa, imposto e despesa no mesmo programa —
                com o resultado de cada oferta.
              </p>
            </div>
            <div className="bento reveal">
              <div className="feat-card span2 glass">
                <div className="icon-box lime">
                  <IconEye />
                </div>
                <h3>Abre o programa, já sabe onde está</h3>
                <p className="benefit">
                  Painel do período com receita, despesa, lucro líquido e ROI.
                  Saúde do caixa em três estados: saudável, atenção ou risco.
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
                <h3>A despesa da operação entra na conta</h3>
                <p className="benefit">
                  Teto por categoria, com aviso em 75%, 90% e 100%. Ferramenta,
                  assinatura e custo fixo não ficam de fora do resultado.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="fechamento">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">FECHAMENTO</div>
              <h2>Fechamento do mês em 1 clique</h2>
              <p>
                Não é fechamento contábil oficial e não substitui o contador. É
                a organização da sua operação: veja receita, despesa,
                investimento, taxas e resultado do período — e exporte em PDF
                ou Excel.
              </p>
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
              <p>
                Sem conta grátis. Você compra a licença do Cashflow Pro e recebe
                uma chave.
              </p>
            </div>
            <div className="steps reveal">
              <div className="step">
                <div className="step-num">01</div>
                <div>
                  <h3>Escolhe o prazo e paga</h3>
                  <p>
                    {lifetimeOn
                      ? "12 meses por R$ 97 ou vitalício por R$ 147. Os dois são pagamento único. O serial só nasce se o pagamento passar."
                      : "12 meses por R$ 97, pagamento único. O serial só nasce se o pagamento passar."}
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">02</div>
                <div>
                  <h3>Paga no cartão ou no PIX</h3>
                  <p>
                    Cartão no Stripe, ou PIX pela Pushin Pay. No PIX, o serial
                    só sai depois que o pagamento cair.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">03</div>
                <div>
                  <h3>Recebe o serial</h3>
                  <p>
                    Por e-mail e na tela de pagamento aprovado, junto com o
                    instalador para Windows e para Mac.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">04</div>
                <div>
                  <h3>Instala no Windows ou no Mac</h3>
                  <p>
                    Baixa o .exe ou o .dmg, abre o programa e cola o Serial Key.
                    Dá para usar direto de um pendrive, se preferir.
                  </p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">05</div>
                <div>
                  <h3>Usa no computador</h3>
                  <p>
                    {lifetimeOn
                      ? "Nos 12 meses, o prazo começa no dia em que você ativa — não no dia em que pagou. No vitalício não há validade. Depois disso o dia a dia é local; de tempos em tempos o app só confirma se a chave ainda vale."
                      : "Os 12 meses começam no dia em que você ativa — não no dia em que pagou. Depois disso o dia a dia é local; de tempos em tempos o app só confirma se a chave ainda vale."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="download">
          <div className="wrap">
            <div className="head reveal">
              <div className="kicker">INSTALADOR</div>
              <h2>Windows e Mac. Você escolhe o seu.</h2>
              <p>
                Baixe o instalador do Cashflow Pro. Sem a chave o programa
                não abre — o serial sai depois do pagamento.
              </p>
            </div>
            <div className="download-grid single reveal">
              <div className="dl-card pro glass">
                <div className="edition mono">CASHFLOW PRO</div>
                <h3>Para quem vende e anuncia</h3>
                <p>
                  Mesma chave nos dois sistemas. Escolha o instalador do seu
                  computador.
                </p>
                <div className="dl-actions">
                  <a href="/download/pro" className="btn btn-ghost">
                    Windows (.exe)
                  </a>
                  <a href="/download/pro/mac" className="btn btn-ghost">
                    Mac (.dmg)
                  </a>
                </div>
              </div>
            </div>
            <p className="dl-note reveal">
              Ainda não tem chave?{" "}
              <a href="#planos">Compre 12 meses por R$ 97</a> e ative depois de
              instalar.
            </p>
          </div>
        </section>

        <section>
          <div className="wrap">
            <div className="priv-band glass reveal">
              <div className="priv-icon">
                <IconLock />
              </div>
              <div>
                <h3>
                  Programa para Windows e Mac. Dados no seu computador. Sem
                  mensalidade recorrente.
                </h3>
                <p>
                  O caixa, as ofertas e os lançamentos ficam na sua máquina —
                  não numa conta na nuvem. O site só vende e libera a chave. A
                  internet entra para pagar, baixar e, de tempos em tempos,
                  confirmar se a licença ainda vale.
                </p>
              </div>
              <a href="#planos" className="btn btn-primary">
                Comprar 12 meses
              </a>
            </div>
          </div>
        </section>

        <PlansSection offers={offers} />

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
                <h2>1 ano de Cashflow Pro — R$ 97</h2>
                <p>
                  Pagamento único. Sem mensalidade recorrente. Você recebe o
                  serial por e-mail e o instalador para Windows ou Mac. Os 12
                  meses só começam a contar quando você ativa.
                </p>
              </div>
              <a href="#planos" className="btn btn-primary">
                Comprar 12 meses — R$ 97
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
            <a href="#download">Baixar</a>
            <a href="#faq">Dúvidas</a>
            <a href="#planos">Plano</a>
            <a href="#telas">Telas</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
