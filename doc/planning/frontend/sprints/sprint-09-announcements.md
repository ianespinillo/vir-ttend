# Sprint 09 — Comunicados

> **Objetivo:** Implementar los comunicados: listado público, creación con targeting (por curso/nivel o todos), detalle y lista "para mí".
> **Duración:** 1 semana · **Estimación:** 25 h · **Dependencias:** Sprint 02

---

## Decisiones de diseño

**Targeting:** `admin` y `preceptor` crean comunicados. El targeting se resuelve en el backend (`targetRole`, `targetCourseId`). El front solo manda ids; el listado ya viene filtrado por el servidor (`GET /announcements`).

**"Para mí"** (`GET /announcements/me`): el usuario ve lo que le aplica. Se marca como **no leído** hasta `GET /announcements/:id` (read state vía cache local + invalidation).

**Dos entradas de navegación:** "Comunicados" (general) y "Para mí" en la sidebar (`nav.ts` de Sprint 02). En el topbar, la bell de alertas (Sprint 07) es de alertas de asistencia, no de comunicados — no se mezclan.

---

## Resumen de horas

| Área | Horas |
|---|---|
| `@repo/common` — tipos/routes comunicados | 2 |
| `@repo/hooks` — hooks announcements | 5 |
| `@repo/ui` — componentes announcements | 10 |
| `apps/client` — páginas | 8 |
| **Total** | **25** |

---

## 1. `@repo/common`

- Tipos (Sprint 00): `AnnouncementResponse`, `CreateAnnouncementDto`. Verificar contra Swagger.
- Rutas (Sprint 00): `ANNOUNCEMENT_ROUTES` (list, me, get, create). Confirmar `me` y `:id`.
- Schema Zod: `announcement.schema.ts` (título, contenido, targetRole?, targetCourseId?).

---

## 2. `@repo/hooks` — hooks

```
packages/hooks/src/features/announcements/
├── use-announcements.ts     # useQuery → GET /announcements?targetCourseId=&page=
├── use-announcements-for-me # useQuery → GET /announcements/me?unreadOnly=&page=
├── use-announcement.ts      # useQuery → GET /announcements/:id (marca leído al entrar)
└── use-create-announcement  # useMutation → POST /announcements
                             # onSuccess: invalida list + me
```

---

## 3. `@repo/ui` — componentes

```
packages/ui/src/components/features/announcements/
├── announcements-list.tsx    # lista paginada con badges de targeting
├── announcement-card.tsx     # título, fecha, targeting, unread dot
├── announcement-detail.tsx   # contenido completo + metadata
├── announcement-form.tsx     # RHF + zod: título, contenido, target (rol/curso)
├── announcement-target-select.tsx # Select curso/nivel/todos según rol
└── for-me-list.tsx           # "Para mí" con filtro unreadOnly
```

---

## 4. `apps/client` — páginas

```
apps/client/src/app/(dashboard)/
├── announcements/
│   ├── page.tsx                    # AnnouncementsList (todos con targeting)
│   ├── create/page.tsx             # AnnouncementForm → back a lista
│   └── [id]/page.tsx               # AnnouncementDetail
└── me/announcements/page.tsx       # ForMeList
```

---

## 5. Tareas por día

### Día 1–2: Contrato + hooks
- [ ] Verificar `ANNOUNCEMENT_ROUTES` y tipos; crear `announcement.schema.ts`
- [ ] `use-announcements`, `use-announcements-for-me`, `use-announcement`, `use-create-announcement`

### Día 3–4: Componentes
- [ ] `announcement-card` con unread dot
- [ ] `announcement-detail`, `announcement-form`, `announcement-target-select`

### Día 5: Páginas
- [ ] `/announcements`, `/announcements/create`, `/announcements/[id]`, `/me/announcements`
- [ ] Entradas en sidebar (nav.ts)

### Día 6: Edge cases + verificación
- [ ] Targeting solo muestra cursos permitidos al usuario
- [ ] Marcar leído al abrir detalle
- [ ] `biome check` + `tsc --noEmit`

---

## 6. Criterios de aceptación

- [ ] Listado paginado con badges de targeting
- [ ] Crear comunicado dirigido a todos / rol / curso según permisos
- [ ] "Para mí" lista solo comunicados que aplican al usuario
- [ ] Abrir detalle marca como leído (dot desaparece)
- [ ] Bell de alertas (Sprint 07) no mezcla comunicados con alertas de asistencia

---

**Siguiente sprint →** [Sprint 10: Admin y Configuración](./sprint-10-admin-settings.md)
