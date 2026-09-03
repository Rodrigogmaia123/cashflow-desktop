import { NextResponse } from "next/server";

/**
 * Bloqueio de API Externa
 * 
 * Retorna 403 para qualquer requisição à API externa
 * enquanto a feature está em desenvolvimento.
 * 
 * Exceções:
 * - /api/auth/* - Rotas de autenticação do NextAuth
 * - /api/webhooks/* - Webhooks do Stripe e outros serviços
 */

const BLOCKED_MESSAGE = {
  error: "API em desenvolvimento",
  message: "Esta funcionalidade estará disponível em breve para clientes Business.",
  status: "coming_soon",
};

function shouldBlock(pathname: string): boolean {
  // Não bloqueia rotas de autenticação
  if (pathname.startsWith("/api/auth")) {
    return false;
  }
  // Não bloqueia webhooks
  if (pathname.startsWith("/api/webhooks")) {
    return false;
  }
  // Bloqueia tudo que começa com /api/
  return pathname.startsWith("/api/");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (!shouldBlock(url.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.json(BLOCKED_MESSAGE, { status: 403 });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (!shouldBlock(url.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.json(BLOCKED_MESSAGE, { status: 403 });
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  if (!shouldBlock(url.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.json(BLOCKED_MESSAGE, { status: 403 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  if (!shouldBlock(url.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.json(BLOCKED_MESSAGE, { status: 403 });
}

export async function PATCH(request: Request) {
  const url = new URL(request.url);
  if (!shouldBlock(url.pathname)) {
    return NextResponse.next();
  }
  return NextResponse.json(BLOCKED_MESSAGE, { status: 403 });
}

