# Vir-ttend

> Sistema SaaS multi-tenant de gestión de asistencia escolar para instituciones de nivel primario y secundario.

---

## 📌 Visión General

**Vir-ttend** es una solución integral diseñada para modernizar el control de asistencia, alertas tempranas de deserción y comunicación escolar:
- **Nivel Primario:** Registro de asistencia diaria por curso y turno.
- **Nivel Secundario:** Registro de asistencia granular por materia y bloque horario.
- **Alertas Automatizadas:** Detección de patrones de inasistencias acumuladas y umbrales críticos.
- **Reportes Institucionales:** Generación de resúmenes mensuales y exportación a Excel y PDF.
- **Arquitectura Flexible:** Diseñado como SaaS multi-tenant con capacidad de despliegues aislados single-tenant manteniendo un único codebase.

---

## 🏗️ Estructura del Monorepo

El proyecto está administrado mediante un monorepo con **[pnpm workspaces](https://pnpm.io/workspaces)** y **[Turborepo](https://turbo.build/)**:

```
vir-ttend/
├── apps/
│   ├── api/                 # Backend REST (NestJS 10, MikroORM 6, PostgreSQL, Redis)
│   ├── client/              # Frontend web de producción (Next.js 16 App Router, React 19)
│   └── demo/                # App interactiva de ventas con estado local determinista
│
├── packages/
│   ├── common/              # DTOs, schemas Zod, interfaces de dominio y constantes de roles
│   ├── hooks/               # Custom hooks de React con TanStack Query y cliente HTTP Axios
│   ├── ui/                  # Componentes de diseño compartidos (Radix UI / Tailwind CSS)
│   ├── typescript-config/   # Configuraciones base de TypeScript (tsconfig)
│   └── eslint-config/       # Configuraciones base de linting y Biome
│
├── doc/                     # Documentación técnica, diseño de módulos y guías de arquitectura
├── compose.yml              # Orquestación de servicios en Docker (PostgreSQL, Redis, API, Client)
└── AI_CONTEXT.md            # Contexto técnico exhaustivo para asistentes de IA y LLMs
```

### Aplicaciones (`apps/`)

| Aplicación | Tipo | Puerto Local | Descripción |
|---|---|---|---|
| **[`apps/api`](apps/api/README.md)** | Backend REST | `3001` (o `3000`) | API construida con NestJS bajo Clean Architecture / Hexagonal. Incluye OpenAPI/Swagger en `/docs`. |
| **[`apps/client`](apps/client/README.md)** | Frontend Web | `3000` | Aplicación oficial de producción conectada a la API con soporte de cookies `httpOnly` y RBAC. |
| **[`apps/demo`](apps/demo/README.md)** | Frontend Demo | `3002` (o configurable) | Entorno de simulación comercial 100% desconectado, persistido en `localStorage` con selector de roles. |

### Paquetes Compartidos (`packages/`)

| Paquete | Descripción |
|---|---|
| **`@repo/common`** | Contratos de datos, validaciones con Zod, enums (`SUPERADMIN`, `ADMIN`, `PRECEPTOR`, `TEACHER`) y helpers de permisos. |
| **`@repo/hooks`** | Hooks reactivos con TanStack Query para todas las entidades del dominio escolar. |
| **`@repo/ui`** | Componentes de interfaz accesibles y layouts completos (`DashboardLayout`, `Sidebar`, diálogos, tablas). |

---

## 🚀 Requisitos Previos

- **Node.js:** Versión 20 o superior
- **pnpm:** Versión 9.8.0 o superior (`corepack enable`)
- **Docker & Docker Compose:** Para servicios de base de datos (PostgreSQL 16) y caché (Redis 7)

## 🏢 Modalidades de Despliegue

Vir-ttend soporta dos modalidades de despliegue sin necesidad de bifurcar o forkear el repositorio:

| Característica | Multi-Tenant (`multi`) | Single-Tenant Privado (`single`) |
|---|---|---|
| **Destino** | SaaS compartido (`vir-ttend.app`) | Instancia dedicada (`colegio.vir-ttend.app`) |
| **Infraestructura** | BD y Redis compartidos | BD PostgreSQL y Redis 100% aislados |
| **Resolución Tenant** | En dos pasos (`/login` → `/select-tenant`) | Automática vía `TENANT_ID` (sin selector) |
| **Bootstrap inicial** | Manual / Seeds | Automático e idempotente al arrancar |
| **Acceso Superadmin** | Habilitado por defecto | Bloqueado por defecto (`ALLOW_SUPERADMIN=false`) |
| **Gestión `/tenants`** | Visible para Superadmin | Oculta y denegada en toda la UI |
| **Orquestación Docker** | `compose.yml` | `compose.single-tenant.yml` |

Para el detalle completo de la arquitectura y el paso a paso, consultar [doc/tenancy-single-tenant.md](doc/tenancy-single-tenant.md).

---

## ⚡ Inicio Rápido

### 1. Clonar e Instalar Dependencias

```bash
git clone https://github.com/tu-organizacion/vir-ttend.git
cd vir-ttend

pnpm install
```

### 2. Iniciar Servicios de Infraestructura

Levantar las instancias locales de PostgreSQL y Redis mediante Docker Compose:

```bash
docker compose up -d postgres redis
```

### 3. Compilar Paquetes Compartidos

La API y los clientes dependen de los tipos compilados de los paquetes compartidos:

```bash
pnpm --filter @repo/common build
pnpm --filter @repo/hooks build
```

### 4. Configurar Variables de Entorno

Copiar los archivos de ejemplo en cada aplicación:

```bash
# Backend API
cp apps/api/.env.example apps/api/.env

# Frontend Client
cp apps/client/.env.local.example apps/client/.env.local
```

### 5. Ejecutar Migraciones de Base de Datos

```bash
cd apps/api
pnpm mikro-orm migration:up
cd ../..
```

### 6. Iniciar Entorno de Desarrollo

Ejecutar todas las aplicaciones concurrentemente con Turborepo:

```bash
pnpm dev
```

O iniciar una aplicación específica:

```bash
pnpm --filter api dev      # Iniciar API en http://localhost:3001
pnpm --filter client dev   # Iniciar Client en http://localhost:3000
pnpm --filter demo dev     # Iniciar Demo en http://localhost:3002
```

---

## 📜 Scripts Principales

| Comando | Acción |
|---|---|
| `pnpm dev` | Inicia todas las aplicaciones en modo desarrollo con recarga en vivo |
| `pnpm build` | Compila todos los paquetes y aplicaciones mediante Turborepo |
| `pnpm test` | Ejecuta las suites de tests unitarios e integración en todo el monorepo |
| `pnpm lint:check` | Verifica estilo y calidad de código con [Biome](https://biomejs.dev/) |
| `pnpm lint:fix` | Corrige problemas de formato y lint automáticamente |
| `pnpm ts:check` | Ejecuta comprobación de tipos TypeScript en todos los workspaces |

---

## 📖 Documentación Adicional

- 🤖 **[AI_CONTEXT.md](AI_CONTEXT.md):** Mapa mental y contexto condensado para LLMs y asistentes de programación.
- 📐 **[Documentación Técnica de Arquitectura](doc/TECHNICAL_DOCUMENTATION.md):** Modelo de dominio, Bounded Contexts y diagramas C4/ERD.
- 🏢 **[Despliegues Aislados Single-Tenant](doc/tenancy-single-tenant.md):** Estrategia de despliegues por colegio sin bifurcar el repositorio.
- ⚙️ **[Guía de Configuración según Tipo](doc/deployment-configuration.md):** Guía práctica para desplegar en modo Multi-Tenant (SaaS) o Single-Tenant (Aislado).
- 📑 **READMEs individuales:**
  - [API Backend (apps/api)](apps/api/README.md)
  - [Web Client (apps/client)](apps/client/README.md)
  - [Demo Comercial (apps/demo)](apps/demo/README.md)
