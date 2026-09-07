# Dockerfile para el Frontend de Vir-ttend (apps/client)
# Build context: raíz del monorepo

# Stage 1: builder
FROM node:20-alpine AS builder

ENV HUSKY=0

RUN npm install -g pnpm@9.8.0

WORKDIR /app

# Copiar manifiestos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json ./apps/client/
COPY packages/common/package.json ./packages/common/
COPY packages/hooks/package.json ./packages/hooks/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/

RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Argumentos de compilación para Next.js
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Compilar paquetes dependientes y la aplicación cliente
RUN pnpm --filter @repo/common build
RUN pnpm --filter @repo/hooks build
RUN pnpm --filter client build

# Asegurar que public exista para evitar errores al copiar en el runner
RUN mkdir -p apps/client/public

# Stage 2: runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar salida standalone y assets estáticos generados por Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/.next/static ./apps/client/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/client/public ./apps/client/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/client/server.js"]
