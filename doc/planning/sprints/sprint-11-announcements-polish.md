# Sprint 11: Comunicados y Polish

**Objetivo:** Sistema de comunicados institucionales y refinamiento final  
**Duración:** 1 semana  
**Estimación:** 30 horas  
**Depende de:** Sprint 07, 09, 10 (Panel, Reports, Export)

---

## Objetivo

Implementar el sistema de comunicados institucionales y realizar el polish final del proyecto para producción.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 3 |
| Application Layer | 5 |
| Infrastructure Layer | 2 |
| Presentation Layer | 3 |
| Frontend (Comunicados) | 8 |
| Polish / DevOps | 9 |
| **Total** | **30** |

---

## Parte 1: Comunicados Institucionales

### Backend - Domain Layer

**Módulo:** `modules/identity` ( Announcement es parte de Identity )

**Archivos a crear:**

```
modules/identity/
├── domain/
│   ├── entities/
│   │   └── announcement.entity.ts   # NUEVO
│   ├── value-objects/
│   │   ├── announcement-id.value-object.ts
│   │   └── announcement-target.value-object.ts  # target_type, target_id
│   └── repositories/
│       └── announcement.repository.interface.ts  # NUEVO
```

**Detalles de entidad:**

| Entidad | Campos |
|---------|--------|
| Announcement | id, school_id, author_id, title, body, target_type, target_id, status, publish_at, created_at |

**target_type:** school | course | level

### Backend - Application Layer

**Archivos a crear:**

```
modules/identity/
├── application/
│   ├── commands/
│   │   ├── create-announcement/
│   │   ├── update-announcement/
│   │   ├── publish-announcement/
│   │   └── delete-announcement/
│   ├── queries/
│   │   ├── get-announcements/
│   │   ├── get-announcement/
│   │   ├── get-announcements-by-target/
│   │   └── get-unread-count/
│   ├── dtos/
│   │   ├── announcement.request.dto.ts
│   │   ├── announcement.response.dto.ts
│   │   └── announcement-filters.dto.ts
│   └── identity.module.ts   # Actualizar
```

### Backend - Infrastructure Layer

**Archivos a crear:**

```
modules/identity/
├── infrastructure/
│   ├── persistence/
│   │   ├── repositories/
│   │   │   └── announcement.repository.ts  # NUEVO
│   │   └── identity.persistence.module.ts   # Actualizar
```

### Backend - Presentation Layer

**Archivos a crear:**

```
modules/identity/
└── presentation/
    ├── controllers/
    │   └── announcements.controller.ts   # NUEVO
    └── identity.presentation.module.ts   # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | /announcements | Listar comunicados |
| POST | /announcements | Crear comunicado |
| GET | /announcements/:id | Obtener comunicado |
| PUT | /announcements/:id | Actualizar comunicado |
| DELETE | /announcements/:id | Eliminar comunicado |
| PATCH | /announcements/:id/publish | Publicar |
| GET | /announcements/unread/count | Count no leídos |

### Frontend - Comunicados

**Pages:**

```
src/app/
├── (dashboard)/
│   └── announcements/
│       ├── page.tsx              # /announcements
│       ├── [id]/
│       │   └── page.tsx         # /announcements/:id
│       ├── create/
│       │   └── page.tsx         # /announcements/create
│       └── components/
│           ├── announcements-list.tsx
│           ├── announcement-card.tsx
│           └── announcement-form.tsx
```

**Components:**

```
src/components/
├── features/
│   └── announcements/
│       ├── announcements-list/
│       ├── announcement-card/
│       ├── announcement-form/
│       └── announcement-detail/
```

**Hooks:**

```
packages/hooks/
├── src/
│   ├── announcements/
│   │   ├── use-announcements.ts
│   │   ├── use-announcement.ts
│   │   ├── use-create-announcement.ts
│   │   ├── use-update-announcement.ts
│   │   └── use-unread-count.ts
```

---

## Parte 2: Polish y Optimización

### Frontend Polish

**Tareas:**

- [ ] Loading states consistentes (skeletons)
- [ ] Error states amigables
- [ ] Empty states informativos
- [ ] Animaciones suaves (framer-motion opcional)
- [ ] Responsive design (mobile/tablet)
- [ ] Verificar accesibilidad

### Performance

**Backend:**

- [ ] Optimizar queries (índices en PostgreSQL)
- [ ] Implementar caché Redis para queries frecuentes
- [ ] Lazy loading de datos

**Frontend:**

- [ ] Code splitting (next/dynamic)
- [ ] Optimizar bundles
- [ ] Optimizar imágenes

### Documentación

- [ ] README.md actualizado
- [ ] Documentar variables de entorno
- [ ] Agregar información de deployment

### DevOps

- [ ] Health check endpoint (GET /health)
- [ ] Script de deployment manual
- [ ] Verificar en hosting (Vercel/Railway/etc)

---

## Testing

**Tareas:**

- [ ] Tests de flujos principales (manual)
- [ ] Verificar funciona en producción
- [ ] Smoke tests

---

## Tareas por Día

### Día 1: Domain Layer (Comunicados)

- [ ] Crear Announcement entity
- [ ] Crear Value Objects

### Día 2: Application Layer (Comunicados)

- [ ] Crear commands de Announcement CRUD
- [ ] Crear queries

### Día 3: Presentation Layer (Comunicados) + Polish start

- [ ] Crear AnnouncementsController
- [ ] Probar con Postman
- [ ] Iniciar polish de UI

### Día 4-5: Frontend (Comunicados)

- [ ] Crear página /announcements
- [ ] Crear AnnouncementForm
- [ ] Conectar con API

### Día 6-7: Polish Final

- [ ] Responsive design
- [ ] Loading states
- [ ] Health check
- [ ] README
- [ ] Deploy

---

## Criterios de Aceptación

### Comunicados

- [ ] CRUD de comunicados funciona
- [ ] Targeting por school/course/level funciona
- [ ] Frontend muestra lista correctamente

### Polish

- [ ] UI pulida y responsive
- [ ] Health check funciona
- [ ] README documentado
- [ ] Proyecto funciona en producción

---

## Fin del Proyecto MVP

**¡Felicitaciones!** Al completar este sprint tendrás el MVP completo de Vir-ttend.
