import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe, syncSubscriptionFromStripe } from "@/lib/billing/stripe";
import { DEFAULT_PLAN } from "@/lib/billing/plans";
import { prisma } from "@/lib/db";
import { DESKTOP_LICENSE_PRODUCT } from "@/lib/license/catalog";
import { fulfillDesktopLicenseSession } from "@/lib/license/fulfill-checkout";
import { deliverIssuedLicenseById } from "@/lib/license/deliver";
import {
  sendSubscriptionConfirmedEmail,
  sendSubscriptionCanceledEmail,
  sendSubscriptionFailedEmail,
} from "@/lib/email/send-email";

/**
 * Webhook handler para eventos do Stripe
 * 
 * IMPORTANTE: Este webhook converte eventos do Stripe (gateway)
 * para operações em nossos planos internos (fonte de verdade).
 * 
 * A lógica de mapeamento Stripe → Planos está em syncSubscriptionFromStripe.
 * 
 * CRÍTICO: Validar assinatura e processar eventos de forma idempotente
 */
export async function POST(req: NextRequest) {
  try {
    const webhookSecretEnv = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecretEnv) {
      console.error("[webhook/stripe] STRIPE_WEBHOOK_SECRET não configurada");
      return NextResponse.json(
        { error: "Configuração do webhook inválida" },
        { status: 500 }
      );
    }

    // Após a verificação, sabemos que webhookSecretEnv é string
    const webhookSecret: string = webhookSecretEnv;

    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[webhook/stripe] Assinatura não encontrada");
      return NextResponse.json(
        { error: "Assinatura não encontrada" },
        { status: 400 }
      );
    }

    // Valida assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("[webhook/stripe] Erro ao validar assinatura:", err);
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 400 }
      );
    }

    // Processa eventos
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.product === DESKTOP_LICENSE_PRODUCT) {
          try {
            const result = await fulfillDesktopLicenseSession(session);
            console.log(
              "[webhook/stripe] desktop-license",
              session.id,
              result
            );
            if (result.outcome === "created" || result.outcome === "exists") {
              try {
                await deliverIssuedLicenseById(result.licenseId);
              } catch (deliverError) {
                console.error(
                  "[webhook/stripe] desktop-license e-mail/serial:",
                  session.id,
                  deliverError
                );
              }
            }
          } catch (error) {
            console.error(
              "[webhook/stripe] desktop-license falhou:",
              session.id,
              error
            );
            return NextResponse.json(
              { error: "Falha ao registrar a licença" },
              { status: 500 }
            );
          }
          break;
        }

        if (session.mode === "subscription") {
          console.log(
            "[webhook/stripe] Checkout session completed para subscription:",
            session.id
          );

          // Envia email de confirmação de assinatura
          try {
            const customerId = session.customer as string;
            const customer = await stripe.customers.retrieve(customerId);

            if (!customer || customer.deleted || typeof customer === "string") {
              break;
            }

            const email = customer.email;
            if (!email) {
              break;
            }

            // Obtém dados da subscription
            const subscriptionId = session.subscription as string;
            if (subscriptionId) {
              const subscription = await stripe.subscriptions.retrieve(
                subscriptionId
              );
              const priceId = subscription.items.data[0]?.price.id;
              const amount = subscription.items.data[0]?.price.unit_amount;

              if (priceId && amount) {
                // Resolve plano do metadata ou do priceId
                const plan =
                  subscription.metadata?.plan || session.metadata?.plan || "PRO";
                const amountFormatted = new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(amount / 100);

                await sendSubscriptionConfirmedEmail(email, plan, amountFormatted);
              }

              // Sincroniza assinatura com o DB e atualiza plano do usuário
              // Rede de segurança: garante atualização mesmo se customer.subscription.created falhar
              try {
                await syncSubscriptionFromStripe(subscription);
                console.log(
                  "[webhook/stripe] Plano sincronizado no checkout.session.completed:",
                  subscription.id
                );
              } catch (syncError) {
                console.error(
                  "[webhook/stripe] Erro ao sincronizar plano no checkout.session.completed:",
                  syncError
                );
                // Não bloqueia o fluxo; customer.subscription.created pode tentar de novo
              }
            }
          } catch (error) {
            console.error(
              "[webhook/stripe] Erro ao enviar email de confirmação:",
              error
            );
            // Não bloqueia o fluxo
          }
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          await syncSubscriptionFromStripe(subscription);
          console.log(
            `[webhook/stripe] Subscription ${event.type}:`,
            subscription.id
          );
        } catch (error) {
          console.error(
            `[webhook/stripe] Erro ao processar subscription ${event.type}:`,
            error
          );
          // Não retorna erro para não fazer Stripe retentar infinitamente
          // Logs serão monitorados
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        try {
          // Sincroniza para atualizar status como canceled
          await syncSubscriptionFromStripe(subscription);

          // Atualiza plan do usuário para plano padrão (FREE)
          // IMPORTANTE: Usa constante canônica DEFAULT_PLAN
          const userId = subscription.metadata?.userId;
          if (userId) {
            await prisma.user.update({
              where: { id: userId },
              data: { plan: DEFAULT_PLAN },
            });
            console.log(
              `[webhook/stripe] Subscription deletada: ${subscription.id}. ` +
                `Usuário ${userId} voltou para plano ${DEFAULT_PLAN}.`
            );

            // Envia email de cancelamento
            try {
              const user = await prisma.user.findUnique({
                where: { id: userId },
              });

              if (user?.email) {
                const plan = subscription.metadata?.plan || "PRO";
                await sendSubscriptionCanceledEmail(user.email, plan);
              }
            } catch (error) {
              console.error(
                "[webhook/stripe] Erro ao enviar email de cancelamento:",
                error
              );
              // Não bloqueia o fluxo
            }
          }
        } catch (error) {
          console.error(
            "[webhook/stripe] Erro ao processar subscription deletada:",
            error
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        try {
          const customerId = invoice.customer as string;
          const customer = await stripe.customers.retrieve(customerId);

          if (!customer || customer.deleted || typeof customer === "string") {
            break;
          }

          const email = customer.email;
          if (!email) {
            break;
          }

          // Obtém dados da subscription
          const subscriptionId = invoice.subscription as string;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(
              subscriptionId
            );
            const plan = subscription.metadata?.plan || "PRO";
            const amount = invoice.amount_due;

            const amountFormatted = new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(amount / 100);

            await sendSubscriptionFailedEmail(email, plan, amountFormatted);
            console.log(
              `[webhook/stripe] Email de falha de pagamento enviado para ${email}`
            );
          }
        } catch (error) {
          console.error(
            "[webhook/stripe] Erro ao processar falha de pagamento:",
            error
          );
          // Não bloqueia o fluxo
        }
        break;
      }

      default:
        console.log(`[webhook/stripe] Evento não processado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[webhook/stripe] Erro geral:", error);
    return NextResponse.json(
      { error: "Erro ao processar webhook" },
      { status: 500 }
    );
  }
}

// Desabilita body parsing padrão do Next.js para webhooks
export const runtime = "nodejs";

