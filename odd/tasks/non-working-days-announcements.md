# Días no laborables (feriados / paros / movilizaciones) y comunicados escolares

## Objetivo
Permitir declarar días no laborables (feriados, paros, jornadas institucionales, suspensión de clases) en el ciclo lectivo y disparar automáticamente un comunicado a nivel colegio (`targetType: 'school'`) notificando la suspensión de clases y el motivo.

## Arquitectura y Diseño
1. **Desacoplamiento entre Bounded Contexts (Clean Architecture)**:
   - El módulo `academic` gestiona el calendario y días no laborables (`AcademicYear.addNonWorkingDay`).
   - El módulo `identity` gestiona los comunicados (`Announcement`).
   - Comunicación asíncrona mediante eventos de dominio (`EventEmitter2`): `academic` emite `NonWorkingDayDeclaredEvent` (`non-working-day.declared`).
   - `NonWorkingDayDeclaredListener` en `identity` (o `notifications`) captura el evento y genera un `Announcement` publicado con destino institucional (`targetType: 'school'`).
2. **Endpoint API**:
   - `POST /academic-years/:id/non-working-days`
   - Body: `{ date: string, reason: string, type?: string, notifySchool?: boolean }`
   - Roles: `ADMIN`.
3. **Frontend (`apps/client` + `packages/ui` + `packages/hooks`)**:
   - Botón y modal en `/settings/academic` (en `AcademicYearCard` o página) para declarar día no laborable con fecha, motivo y switch de comunicado escolar.
   - Mutación que invalida caché de `academic-years` y `announcements`.
4. **Demo Store (`apps/demo`)**:
   - Soporte en demo store para agregar día no laborable y crear el comunicado correspondiente en el estado en memoria.

## Tareas
- [x] T1: Domain Event `NonWorkingDayDeclaredEvent` y Command `DeclareNonWorkingDayCommand` + Handler en `academic`.
- [x] T2: Event Listener `NonWorkingDayDeclaredListener` en `identity` para crear y publicar el comunicado escolar.
- [x] T3: Endpoint en `AcademicYearController` (`POST /academic-years/:id/non-working-days`) con DTO y validaciones.
- [x] T4: Tests unitarios para handler, listener y controller.
- [x] T5: Hooks y tipos en `@repo/common` y `@repo/hooks`.
- [x] T6: Componente modal y UI en `packages/ui` / `apps/client`.
- [x] T7: Soporte en `apps/demo`.
- [x] T8: Verificación end-to-end (lint, typecheck, tests).

