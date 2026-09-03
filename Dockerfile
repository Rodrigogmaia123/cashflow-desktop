FROM node:20-slim

RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
COPY . .

RUN npx prisma generate

ENV DESKTOP_MODE=false
ENV NEXT_PUBLIC_DESKTOP_MODE=false
ENV DATABASE_URL=file:../data/cashflow-desktop.db

RUN mkdir -p /app/data
RUN npm run build

ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "scripts/start.cjs"]
