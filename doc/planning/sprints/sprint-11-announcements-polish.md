# Sprint 11 — Comunicados y Polish Final

> **Objetivo:** Implementar el módulo de comunicados institucionales y realizar el polish final: UX, performance, health check y deploy.
> **Duración:** 1 semana · **Estimación:** 32 h · **Dependencias:** Sprint 07, 09, 10

---

## Resumen de horas

| Área | Horas |
|---|---|
| Comunicados — Domain + Application | 5 |
| Comunicados — Infrastructure + Presentation | 4 |
| Comunicados — Frontend | 7 |
| Polish UI/UX | 6 |
| Performance & Caché | 4 |
| DevOps & Deploy | 4 |
| Documentación | 2 |
| **Total** | **32** |

---

## Parte 1: Comunicados Institucionales

### Concepto

Un **Announcement** es un comunicado institucional creado por admin o preceptor y dirigido a una audiencia (`school` completa, un `course` específico, o todos los cursos de un `level`). El frontend muestra los comunicados relevantes según el rol del usuario. No tiene read-receipts en el MVP (deuda técnica documentada).

---

### 1.1 Domain Layer — `modules/identity/domain` (ampliar)

```
apps/api/src/modules/identity/domain/
├── entities/
│   └── announcement.entity.ts              # Aggregate root del comunicado
├── value-objects/
│   ├── announcement-id.value-object.ts
│   └── announcement-target.value-object.ts # { targetType: 'school'|'course'|'level', targetId: string }
│                                           # validate(): si targetType='level', targetId debe ser 'primary'|'secondary'
└── repositories/
    └── announcement.repository.interface.ts # findById, findBySchool, findByTarget, findByAuthor,
                                            # save, delete, findUnreadCount (futuro)
```

### Esquema de entidad

| Entidad | Campos |
|---|---|
| `Announcement` | `id`, `schoolId`, `tenantId`, `authorId`, `title`, `body`, `targetType` ('school'\|'course'\|'level'), `targetId`, `status` ('draft'\|'published'), `publishAt` (nullable), `createdAt`, `updatedAt` |

---

### 1.2 Application Layer — `modules/identity/application` (ampliar)

```
apps/api/src/modules/identity/application/
├── commands/
│   ├── create-announcement/
│   │   ├── create-announcement.command.ts  # { schoolId, title, body, targetType, targetId, publishAt? }
│   │   └── create-announcement.handler.ts  # crea con status='draft', si publishAt = null → publica inmediatamente
│   ├── update-announcement/
│   │   ├── update-announcement.command.ts  # { announcementId, title?, body?, targetType?, targetId? }
│   │   └── update-announcement.handler.ts  # solo si status='draft'
│   ├── publish-announcement/
│   │   ├── publish-announcement.command.ts # { announcementId }
│   │   └── publish-announcement.handler.ts # cambia status a 'published', setea publishAt = now()
│   └── delete-announcement/
│       ├── delete-announcement.command.ts  # { announcementId }
│       └── delete-announcement.handler.ts  # soft delete o hard delete según status
├── queries/
│   ├── get-announcements/
│   │   ├── get-announcements.query.ts      # { schoolId, targetType?, status?, page, limit }
│   │   └── get-announcements.handler.ts
│   ├── get-announcement/
│   │   ├── get-announcement.query.ts       # { announcementId }
│   │   └── get-announcement.handler.ts
│   └── get-announcements-for-user/
│       ├── get-announcements-for-user.query.ts  # { userId, schoolId, courseId?, level? }
│       └── get-announcements-for-user.handler.ts # filtra por target: school + course del usuario + nivel
├── dtos/
│   ├── create-announcement.request.dto.ts  # title (required), body (required), targetType, targetId, publishAt?
│   ├── update-announcement.request.dto.ts  # todos opcionales
│   ├── announcement.response.dto.ts        # id, title, body, targetType, targetId, status, publishAt, authorName, createdAt
│   └── announcements-list.response.dto.ts # items[], total, page
└── identity.module.ts                      # actualizar
```

---

### 1.3 Infrastructure Layer — `modules/identity/infrastructure` (ampliar)

```
apps/api/src/modules/identity/infrastructure/
├── persistence/
│   ├── entities/
│   │   └── announcement.orm-entity.ts      # @Entity() Announcement
│   ├── repositories/
│   │   └── announcement.repository.ts
│   ├── mappers/
│   │   └── announcement.mapper.ts
│   └── identity.persistence.module.ts     # actualizar
```

### Migración a generar

```bash
pnpm mikro-orm migration:create --name=create_announcements
```

Tabla:
- `announcements` (id, school_id, tenant_id, author_id, title, body, target_type, target_id, status, publish_at, created_at, updated_at)
- Índice: `(school_id, status, publish_at)` — para listar publicados ordenados

---

### 1.4 Presentation Layer — `modules/identity/presentation` (ampliar)

```
apps/api/src/modules/identity/presentation/
├── controllers/
│   └── announcements.controller.ts         # CRUD + /publish + /for-user
└── identity.presentation.module.ts        # actualizar
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `GET` | `/announcements?schoolId=&status=` | `admin`, `preceptor` | Listar comunicados |
| `POST` | `/announcements` | `admin`, `preceptor` | Crear comunicado |
| `GET` | `/announcements/:id` | `admin`, `preceptor` | Obtener comunicado |
| `PUT` | `/announcements/:id` | `admin`, `preceptor` (solo autor) | Actualizar borrador |
| `DELETE` | `/announcements/:id` | `admin` | Eliminar comunicado |
| `PATCH` | `/announcements/:id/publish` | `admin`, `preceptor` (solo autor) | Publicar borrador |
| `GET` | `/announcements/for-me` | todos | Comunicados dirigidos al usuario autenticado |

---

### 1.5 Frontend — Comunicados

```
packages/ui/src/components/features/announcements/
├── announcements-list/
│   ├── index.ts
│   ├── announcements-list.tsx              # Lista de comunicados con filtro por estado y target
│   │                                       # Props: announcements[], onEdit, onPublish, onDelete
│   └── announcement-card.tsx              # Card: título, target badge, fecha, estado (borrador/publicado)
│                                           # Props: announcement, onEdit, onPublish, onDelete
├── announcement-form/
│   ├── index.ts
│   └── announcement-form.tsx              # Formulario: título, cuerpo (textarea), target selector
│                                           # Props: onSubmit, isLoading, defaultValues?
├── announcement-detail/
│   ├── index.ts
│   └── announcement-detail.tsx            # Vista completa: título, cuerpo, autor, fecha, target
│                                           # Props: announcement: AnnouncementResponseDto
├── target-selector.tsx                     # Select de tipo target + input de ID según tipo
│                                           # Props: value: { targetType, targetId }, onChange
│                                           # options dinámicas: si school → sin ID, si course → CourseSelect
└── announcement-target-badge.tsx          # Badge: "Toda la escuela" | "3° B" | "Secundaria"
                                            # Props: targetType, targetId, courses[]
```

```
packages/hooks/src/
├── announcements/
│   ├── use-announcements.ts               # useQuery → apiClient.get(announcements
│   ├── use-my-announcements.ts            # useQuery → apiClient.get(announcements/for-me
│   ├── use-announcement.ts                # useQuery → apiClient.get(announcements/:id
│   ├── use-create-announcement.ts         # useMutation → apiClient.post(announcements
│   ├── use-update-announcement.ts         # useMutation → apiClient.put(announcements/:id
│   ├── use-publish-announcement.ts        # useMutation → apiClient.patch(announcements/:id/publish
│   └── use-delete-announcement.ts         # useMutation → apiClient.delete(announcements/:id
└── index.ts                               # actualizar
```

```
apps/client/src/app/(dashboard)/announcements/
├── page.tsx                                # Importa AnnouncementsList de @vir-ttend/ui
│                                           # Usa useAnnouncements, useDeleteAnnouncement, usePublishAnnouncement
├── create/
│   └── page.tsx                            # Importa AnnouncementForm de @vir-ttend/ui
│                                           # Usa useCreateAnnouncement
└── [id]/
    ├── page.tsx                            # Importa AnnouncementDetail de @vir-ttend/ui
    │                                       # Usa useAnnouncement
    └── edit/
        └── page.tsx                        # Importa AnnouncementForm con defaultValues
                                            # Usa useUpdateAnnouncement
```

---

## Parte 2: Polish UI/UX

### 2.1 Loading states — `packages/ui` (actualizar todos los componentes)

```
packages/ui/src/components/features/
├── attendance/attendance-grid/attendance-grid.tsx    # Mostrar skeleton mientras isLoading
├── students/students-table.tsx                       # Skeleton de tabla con N filas
├── reports/monthly-report-table/monthly-report-table.tsx  # Skeleton mientras carga
└── dashboard/courses-overview/courses-overview.tsx   # Skeleton de cards
```

### 2.2 Empty states — `packages/ui` (actualizar)

```
packages/ui/src/components/shared/empty-state.tsx    # Asegurarse de que todos los listados
                                                      # usan EmptyState cuando items.length === 0
# Casos a verificar:
# - Lista de cursos vacía → "No hay cursos. Crear el primero"
# - Alumnos sin registro de asistencia → "Selecciona un curso y fecha"
# - Sin alertas → "Todo en orden 🎉"
# - Sin comunicados → "No hay comunicados publicados"
```

### 2.3 Error states — `packages/ui` (actualizar)

```
packages/ui/src/components/shared/error-state.tsx    # Mostrar en todos los useQuery que fallen
                                                      # Props: error, onRetry
# Agregar manejo en:
# - DailyAttendancePage
# - PreceptorDashboard
# - MonthlyReportTable
```

### 2.4 Responsive design — `packages/ui`

```
# Verificar y ajustar breakpoints en:
packages/ui/src/components/layout/sidebar.tsx         # Colapsable en mobile (hamburger menu)
packages/ui/src/components/layout/dashboard-layout.tsx # Drawer en mobile
packages/ui/src/components/features/attendance/attendance-grid/attendance-grid.tsx
# → En mobile: mostrar una fila por alumno apilada verticalmente
packages/ui/src/components/features/reports/monthly-report-table/monthly-report-table.tsx
# → En mobile: scroll horizontal con columnas fijas (apellido + nombre)
```

---

## Parte 3: Performance y Caché

### 3.1 Backend — queries con caché Redis

```
apps/api/src/modules/attendance/infrastructure/
└── persistence/repositories/
    └── attendance-record.repository.ts     # Agregar caché en:
                                            # - getCourseSummaryForDate() → TTL: 5 min
                                            # - (el dashboard se actualiza por polling, no necesita TTL 0)

apps/api/src/modules/reporting/infrastructure/
└── persistence/repositories/
    └── report.repository.ts               # Agregar caché en:
                                            # - findByCourseAndPeriod() → TTL: 1 hora (reportes son estables)
```

### 3.2 Backend — índices de PostgreSQL

```sql
-- Verificar que existen los siguientes índices (agregar en migración si faltan):
CREATE INDEX IF NOT EXISTS idx_attendance_records_course_date ON attendance_records(course_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_unseen ON attendance_alerts(seen_at) WHERE seen_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_course ON students(course_id) WHERE status = 'active';
```

### 3.3 Frontend — optimizaciones

```
apps/client/
# Agregar en next.config.js:
# - output: 'standalone' (para deploy en Railway/Docker)
# - images.domains para cualquier CDN futuro

packages/ui/src/components/features/reports/monthly-report-table/monthly-report-table.tsx
# Agregar React.memo() en ReportRow para evitar re-renders al cambiar filtros
```

---

## Parte 4: DevOps y Deploy

### 4.1 Health check endpoint

```
apps/api/src/modules/health/
├── health.controller.ts                    # GET /health → { status: 'ok', timestamp, version }
│                                           # GET /health/db → verifica conexión PostgreSQL
│                                           # GET /health/redis → verifica conexión Redis
└── health.module.ts                        # registra controller, importar en AppModule
```

### 4.2 Archivos de deploy

```
/                                           ← raíz del monorepo
├── Dockerfile.api                          # Multi-stage: builder (pnpm build) + runner (node:20-alpine)
├── Dockerfile.client                       # Multi-stage para Next.js standalone
├── .env.production.example                 # Template de variables de producción
└── railway.json                            # Config de Railway (o render.yaml para Render)
```

### `Dockerfile.api`

```dockerfile
# Stage 1: builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/common/package.json ./packages/common/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @vir-ttend/common build
RUN pnpm --filter @vir-ttend/api build

# Stage 2: runner
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main"]
```

---

## Parte 5: Documentación

```
/                                           ← raíz del monorepo
└── README.md                               # Actualizar con:
                                            # - Descripción del proyecto
                                            # - Requisitos (Node 20, pnpm, Docker)
                                            # - Setup local: docker-compose + pnpm install + pnpm dev
                                            # - Variables de entorno (referencia a .env.example)
                                            # - Estructura del monorepo
                                            # - Comandos: build, test, lint, migrate
```

---

## Tareas por día

### Día 1: Comunicados — Domain + Application
- [ ] Entidad `Announcement` y VO `AnnouncementTarget`
- [ ] Commands: create, update, publish, delete
- [ ] Queries: list, get, for-user

### Día 2: Comunicados — Infrastructure + Presentation
- [ ] ORM entity, repository, mapper
- [ ] Migración
- [ ] `AnnouncementsController`
- [ ] Probar con Postman

### Día 3: Comunicados — Frontend
- [ ] Componentes en `packages/ui`
- [ ] Hooks en `packages/hooks`
- [ ] Páginas en `apps/client`

### Día 4: Polish UI/UX
- [ ] Loading states con skeleton en todos los listados
- [ ] Empty states en todos los casos vacíos
- [ ] Error states con retry
- [ ] Sidebar responsive con hamburger en mobile

### Día 5: Performance + Caché
- [ ] Caché Redis en endpoints del dashboard y reportes
- [ ] Verificar índices de PostgreSQL
- [ ] `React.memo` en tablas pesadas

### Día 6: DevOps
- [ ] Health check endpoints
- [ ] `Dockerfile.api` y `Dockerfile.client`
- [ ] Verificar deploy en Railway/Render
- [ ] Variables de entorno de producción

### Día 7: Documentación y cierre
- [ ] Actualizar `README.md`
- [ ] Smoke tests manuales del flujo completo
- [ ] Resolver bugs críticos encontrados

---

## Criterios de aceptación

### Comunicados
- [ ] CRUD de comunicados funciona
- [ ] Targeting por school, course y level funciona correctamente
- [ ] Solo el autor (o admin) puede editar o eliminar su comunicado
- [ ] `GET /announcements/for-me` retorna los comunicados relevantes para el usuario autenticado

### Polish
- [ ] Todos los listados muestran skeleton mientras cargan
- [ ] Todos los listados muestran EmptyState cuando no hay datos
- [ ] Todos los fetch errors muestran ErrorState con botón de retry
- [ ] Sidebar es usable en mobile (hamburger menu)

### DevOps
- [ ] `GET /health` retorna 200 en producción
- [ ] `GET /health/db` confirma conexión a PostgreSQL
- [ ] Docker build funciona sin errores
- [ ] Deploy en Railway/Render corre sin errores

---

## 🎉 MVP Completado

Al terminar este sprint, Vir-ttend tiene:

- Autenticación JWT multi-tenant con roles
- Gestión académica: años, cursos, materias, horarios
- Gestión de estudiantes con matriculación
- Asistencia diaria (primaria) y por materia (secundaria)
- Panel de preceptoría con semáforo en tiempo real
- Alertas automáticas por umbral de ausencias
- Reportes mensuales exportables a Excel y PDF
- Comunicados institucionales con targeting
- UI responsive, con loading/empty/error states
- Deploy productivo con health checks

---

**Deudas técnicas documentadas para v2:**
- Read-receipts de comunicados
- Notificaciones push / email al generar alertas
- Cron job para generación automática de reportes mensuales
- Tabla separada para datos de estudiantes dentro del reporte (reemplazar JSONB)
- Import masivo de estudiantes via CSV
- Historial de transferencias de estudiantes
- Row Level Security de PostgreSQL nativo (actualmente por middleware)
