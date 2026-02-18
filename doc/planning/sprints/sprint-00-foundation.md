# Sprint 00: Foundation

**Objetivo:** Configurar infraestructura base del proyecto  
**Duración:** 1 semana  
**Estimación:** 40 horas

---

## Objetivo

Configurar el monorepo, backend NestJS con arquitectura hexagonal, frontend Next.js, y infraestructura de desarrollo.

---

## Estimación

| Área | Horas |
|------|-------|
| Monorepo Setup | 8 |
| Backend Foundation | 16 |
| Frontend Foundation | 12 |
| Infra Dev | 4 |
| **Total** | **40** |

---

## Backend

### Domain Layer

**Archivos a crear:**

```
src/modules/shared/database/
├── entities/
│   ├── base.entity.ts          # Entity base con id, created_at, updated_at
│   └── tenant-base.entity.ts  # Entity base con tenant_id
```

### Application Layer

**Archivos a crear:**

```
src/modules/shared/
├── config/
│   ├── database.config.ts     # MikroORM config
│   ├── redis.config.ts        # Redis config
│   └── app.config.ts          # App config (env vars)
```

### Infrastructure Layer

**Archivos a crear:**

```
src/modules/shared/
├── database/
│   ├── mikro-orm.config.ts   # MikroORM setup
│   ├── entities/              # (del Domain Layer)
│   └── migrations/            # Migraciones (vacío)
├── cache/
│   └── cache.module.ts        # Redis cache module
└── events/
    └── event-bus.module.ts    # Event bus basic setup
```

### Presentation Layer

**Archivos a crear:**

```
src/
├── main.ts                    # Entry point con MikroORM bootstrap
├── app.module.ts              # Root module
├── common/
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   └── constants/
│       └── roles.ts           # Enum de roles vacío
```

### Paquetes Compartidos

**Archivos a modificar/crear:**

```
packages/common/
├── src/
│   ├── index.ts
│   ├── types/
│   │   └── index.ts           # Tipos base (Tenant, User, etc.)
│   ├── constants/
│   │   ├── roles.ts
│   │   └── attendance-status.ts
│   └── dto/
│       └── index.ts
```

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── layout.tsx                 # Root layout básico
├── page.tsx                  # Landing / redirect
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── ui/                       # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   └── ...
└── shared/
    ├── loading-spinner.tsx
    └── empty-state.tsx
```

### Hooks

**Archivos a crear:**

```
packages/hooks/
├── src/
│   └── index.ts              # Export básico
```

### Lib

**Archivos a crear:**

```
src/lib/
├── api/
│   ├── client.ts             # Fetch/axios client
│   └── endpoints.ts          # Endpoints definitions
├── utils/
│   ├── cn.ts                 # classnames + tailwind
│   └── date.ts
├── auth/
│   ├── provider.tsx          # Auth context
│   └── utils.ts
└── config/
    └── site-config.ts
```

---

## Infra / DevOps

### Archivos a crear:

```
# Root
docker-compose.yml            # PostgreSQL + Redis
.env.example                  # Template de variables
.env                          # Local dev vars

# API
apps/api/.env                # DATABASE_URL, REDIS_URL, JWT_SECRET

# Client
apps/client/.env.local        # NEXT_PUBLIC_API_URL
```

---

## Testing

**Archivos a crear/verificar:**

```
apps/api/
├── test/
│   └── utils/
│       └── test-helpers.ts  # Helpers básicos
└── jest.config.ts           # Jest config (verificar existe)

apps/client/
└── vitest.config.ts         # Vitest config (si aplica)
```

---

## Dependencias a Instalar

### Backend

```json
{
  "@nestjs/common": "^10.x",
  "@nestjs/core": "^10.x",
  "@nestjs/platform-express": "^10.x",
  "mikro-orm": "^6.x",
  "@mikro-orm/postgresql": "^6.x",
  "ioredis": "^5.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.14.x",
  "bcrypt": "^5.x",
  "@nestjs/passport": "^10.x",
  "passport": "^0.7.x",
  "passport-jwt": "^4.x",
  "jsonwebtoken": "^9.x",
  "rxjs": "^7.x"
}
```

### Frontend

```json
{
  "next": "^15.x",
  "react": "^18.x",
  "@tanstack/react-query": "^5.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x",
  "tailwindcss": "^3.x",
  "clsx": "^2.x",
  "tailwind-merge": "^2.x"
}
```

---

## Tareas por Día

### Día 1-2: Monorepo

- [ ] Configurar pnpm workspace
- [ ] Configurar Turborepo
- [ ] Configurar TypeScript paths
- [ ] Configurar Biome
- [ ] Configurar Husky

### Día 3-4: Backend Foundation

- [ ] Inicializar NestJS
- [ ] Configurar MikroORM
- [ ] Crear entidades base
- [ ] Configurar filters/interceptors
- [ ] Configurar .env

### Día 5: Frontend Foundation

- [ ] Inicializar Next.js
- [ ] Configurar Tailwind
- [ ] Configurar shadcn/ui
- [ ] Configurar TanStack Query

### Día 6-7: Integración

- [ ] Docker compose
- [ ] Verificar conexión DB
- [ ] Verificar `pnpm dev`
- [ ] Tests básicos

---

## Criterios de Aceptación

- [ ] `pnpm install` funciona sin errores
- [ ] `pnpm build` compila todos los paquetes
- [ ] `pnpm dev` inicia frontend y backend
- [ ] PostgreSQL y Redis conectan correctamente
- [ ] TypeScript sin errores en ambos proyectos

---

## Siguiente Sprint

- Sprint 01: Autenticación Base (JWT, Login, Register)
