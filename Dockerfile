FROM node:20-slim

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# NÃO usar /app: a rota /app vive em app/app, e com a raiz do projeto em /app o
# Next resolve app/app/layout.tsx como layout raiz de todas as rotas. Resultado:
# toda página redireciona para /login e o site perde o globals.css.
WORKDIR /srv/cashflow

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
# --include=dev: se o painel exportar NODE_ENV=production, o npm pula as
# devDependencies e o build sai sem Tailwind (site inteiro sem estilo).
RUN npm ci --include=dev
# O lockfile vem do Windows e não traz o SWC Linux; sem isso o Next 16 cai no WASM e o build quebra.
RUN npm install --no-save @next/swc-linux-x64-gnu@16.0.10

COPY prisma ./prisma
COPY . .

RUN npx prisma generate

ENV DESKTOP_MODE=false
ENV NEXT_PUBLIC_DESKTOP_MODE=false

# Banco FORA do código do deploy. Sem volume nisto, o start recusa banco vazio.
# No painel: persistência em /data/cashflow
RUN mkdir -p /data/cashflow
VOLUME ["/data/cashflow"]
RUN npm run build

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "scripts/start.cjs"]
