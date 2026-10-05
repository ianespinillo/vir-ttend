# Vir-ttend Web Client (`apps/client`)

Frontend web oficial de **Vir-ttend**, el sistema SaaS multi-tenant de gestión de asistencia escolar para instituciones de nivel primario y secundario.

---

## 🛠️ Stack Tecnológico

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router) + [React](https://react.dev/) 19 + TypeScript
- **Estilos y UI:** [Tailwind CSS](https://tailwindcss.com/), iconos de [Lucide React](https://lucide.dev/), notificaciones con [Sonner](https://sonner.emilkowal.ski/)
- **Componentes Compartidos:** `@repo/ui` (sistema de componentes basado en Radix UI / shadcn y layouts globales)
- **Data Fetching y Estado de Servidor:** [TanStack Query](https://tanstack.com/query/latest) (React Query) vía `@repo/hooks`
- **Modelos y Schemas Compartidos:** `@repo/common` (DTOs, contratos Zod, enums de roles y helpers de permisos)
- **Cliente HTTP:** Axios configurado con `withCredentials: true` para autenticación transparente vía cookies `httpOnly`

---

## 📦 Arquitectura y Módulos

El cliente organiza sus rutas utilizando Route Groups de Next.js (`app/(auth)` y `app/(dashboard)`):

```
apps/client/src/
├── app/
│   ├── (auth)/                          # Rutas públicas de autenticación
│   │   ├── login/                       # Pantalla de inicio de sesión con email/password
│   │   └── select-tenant/               # Selector de institución para usuarios multi-tenant
│   ├── (dashboard)/                     # Rutas protegidas bajo el App Shell
│   │   ├── layout.tsx                   # Layout con DashboardLayout, Sidebar y verificación de rol
│   │   ├── dashboard/                   # Panel principal (métricas de asistencia, alertas, accesos rápidos)
│   │   ├── students/                    # Nómina de alumnos, matriculación, filtros por curso y legajo
│   │   ├── courses/                     # Cursos, divisiones, materias asignadas y preceptor
│   │   ├── attendance/                  # Módulos de registro de asistencia
│   │   │   ├── daily/                   # Asistencia diaria por curso (Nivel Primario)
│   │   │   └── subject/                 # Asistencia por materia y bloque horario (Nivel Secundario)
│   │   ├── alerts/                      # Bandeja de alertas de inasistencias críticas acumuladas
│   │   ├── announcements/               # Publicación y visualización de comunicados escolares
│   │   ├── reports/                     # Reportes mensuales de asistencia y exportación Excel/PDF
│   │   ├── users/                       # Administración de usuarios, roles y membresías de la institución
│   │   ├── tenants/                     # Gestión de instituciones/sedes (exclusivo Superadmin)
│   │   ├── settings/                    # Ajustes institucionales y calendario académico
│   │   └── me/                          # Perfil de usuario autenticado
│   ├── layout.tsx                       # Root layout (fuentes Geist, Toaster de Sonner)
│   ├── error.tsx / not-found.tsx        # Manejadores visuales de error 404 y fallos de renderizado
│   └── globals.css                      # Variables CSS y tokens de diseño
├── lib/
│   └── auth/                            # AuthProvider y guards de cliente
├── stores/                              # Estado de cliente ligero (auth-store)
└── middleware.ts                        # Protección perimetral de rutas por presencia de cookies de sesión
```

---

## 🔐 Control de Acceso y Roles (RBAC)

La aplicación aplica control de acceso granular en base a los roles de `@repo/common`:

| Rol | Alcance y Capacidades |
|---|---|
| **`SUPERADMIN`** | Plataforma global. Acceso total a `/tenants`, gestión de cualquier institución y capacidad de impersonación. |
| **`ADMIN`** | Directivo escolar. Configuración institucional, gestión de usuarios (`/users`), cursos (`/courses`), comunicados y reportes. |
| **`PRECEPTOR`** | Preceptoría. Registro de asistencia diaria y por materia, gestión de inasistencias, justificaciones, alertas tempranas y reportes. |
| **`TEACHER`** | Docente. Registro de asistencia exclusivo para sus materias asignadas en el nivel secundario. |

---

## ⚙️ Variables de Entorno

Crear un archivo `.env.local` en `apps/client` tomando como base `.env.local.example`:

```bash
# apps/client/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
```

| Variable | Requerida | Default | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Sí | `http://localhost:3001` | URL base de la API backend NestJS |

---

## 🚀 Ejecución en Desarrollo

Desde la raíz del monorepo:

```bash
# 1. Asegurarse de tener paquetes compartidos compilados
pnpm --filter @repo/common build
pnpm --filter @repo/hooks build

# 2. Iniciar el servidor de desarrollo de Next.js (con Turbopack)
pnpm --filter client dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Scripts Disponibles

| Script | Descripción |
|---|---|
| `pnpm --filter client dev` | Inicia Next.js en modo desarrollo con `--turbo` |
| `pnpm --filter client build` | Compila la aplicación para producción (standalone output) |
| `pnpm --filter client start` | Inicia el servidor de producción compilado |
| `pnpm --filter client lint` | Ejecuta ESLint sobre el proyecto |
| `pnpm --filter client ts:check` | Verifica tipos estáticos con `tsc --noEmit` |

---

## 🐳 Docker

El `Dockerfile` de `apps/client` utiliza una compilación multi-stage basada en `node:20-alpine` generando una salida **standalone**:

```bash
# Compilar imagen Docker (contexto desde la raíz del monorepo)
docker build -f apps/client/Dockerfile -t virttend-client .

# Ejecutar contenedor
docker run --rm -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3001 virttend-client
```
