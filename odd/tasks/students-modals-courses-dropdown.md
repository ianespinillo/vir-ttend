# Fix + migración: dropdown de cursos vacío y modales de alumnos

## Objetivo
1. Que el selector de cursos salga poblado en matricular / crear / editar alumno.
2. Migrar crear y editar alumno a modales, espejando el patrón de la página de Usuarios.

## Problema / Por qué
Reporte del usuario: "si quiero matricular a un alumno no me salen los cursos, lo mismo
al crearlo o actualizarlo… migra esto a modales como con la página de usuarios".

## Causa raíz del dropdown (verificada, no hipótesis)
- `GET /courses` → `200 {"data":[]}`; `GET /courses?academicYearId=710d8506-…` → `200` con los 3 cursos.
- `apps/api/.../course.controller.ts:103-109` declara `academicYearId` `required: true` pero **no hay
  validación** → si falta llega `undefined` y la query no matchea.
- `packages/hooks/src/features/courses/use-courses.ts:31` → `enabled: Boolean(academicYearId)`
  → sin el parámetro **la query ni se dispara**.
- Llamadas sin argumentos: `students/page.tsx:38`, `students/create/page.tsx:11`,
  `students/[id]/page.tsx:42`.
- Referencia que funciona: `announcements/page.tsx:53-54` → `useActiveAcademicYear()` +
  `useCourses({ academicYearId: activeYear?.id })`.

## Patrón de referencia (Usuarios)
- Create: ruta interceptada → `settings/users/layout.tsx` renderiza `{children}{modal}`,
  `settings/users/@modal/(.)create/page.tsx` abre el `Dialog` y al cerrar hace `router.back()`,
  `settings/users/create/page.tsx` queda como fallback de navegación directa.
- Edit: `Dialog` puro por `useState` dentro de la página (no toca la URL) — `users-page.tsx:401-443`.
- Refresh: la invalidación vive en los hooks (`use-create-user.ts:20-24`), no en las páginas.

## Alcance (autorizado por el usuario: "todo el fix")
- A. Poblar el dropdown de cursos en las 3 páginas de alumnos.
- B. Modal de **crear** alumno vía `@modal/(.)create` + `layout.tsx` + `@modal/default.tsx`.
- C. Modal de **editar** alumno (hoy swap de página con `?edit=true`) → `Dialog` de estado.
- D. Reemplazar los `router.push('/students')` post-submit por cierre de modal.
- E. Verificación: typecheck/build del cliente + prueba en navegador.

## Fuera de alcance
- Migrar cursos / comunicados / institución a modales (no incluido en lo aprobado).
- Flujo de "desmatricular" (no existe ni en front ni en API: sería funcionalidad nueva).
- Reemplazar los `window.confirm` nativos por `AlertDialog`.
- Requiere rebuild de la imagen `vir-ttend_client` para verse en vivo.

## Restricciones
- No commitear (el árbol mezcla trabajo en curso del usuario).
- No tocar `apps/api` salvo si la validación de `academicYearId` resulta necesaria.
- `nav.ts` usa prefix-match para `/students` → los permisos por rol siguen cubiertos.

## Hallazgo adicional (verificación E2E): el guardado de edición siempre devolvía 400
- Preexistente (idéntico en HEAD), no introducido por esta migración:
  `PUT /students/:id` → `400 ["property documentNumber should not exist",
  "property courseId should not exist", "tutorEmail must be an email"]`.
- Causa: el formulario envía los 8 valores de `createStudentSchema`, pero
  `UpdateStudentRequestDto` solo admite 6 (`firstName`, `lastName`, `birthDate`, `tutorName`,
  `tutorPhone`, `tutorEmail`) y `main.ts:22` tiene `forbidNonWhitelisted: true`.
- El dominio confirma el diseño: `Student._documentNumber` es `readonly` (no hay método de
  actualización) y el curso solo cambia por `POST /students/:id/enroll` o `/transfer`
  (transfer además marca estado `TRANSFERRED`).
- Decisión del usuario (2026-10-08): **deshabilitar DNI y curso en el formulario de edición**;
  el formulario envía solo personales + tutor y el curso se cambia con Matricular/Transferir.

## Checklist de tareas
- [x] T1. `students/page.tsx`, `students/create/page.tsx`, `students/[id]/page.tsx`: `useActiveAcademicYear()` + `useCourses({ academicYearId: activeYear?.id })`.
- [x] T2. Crear `students/layout.tsx` (`{children}{modal}`), `students/@modal/default.tsx`, `students/@modal/(.)create/page.tsx`.
- [x] T3. Convertir la edición (`?edit=true` en `students/[id]/page.tsx`) en `Dialog` de estado.
- [x] T4. Quitar los redirects post-submit en el contexto modal (`router.push('/students')`, `router.replace`).
- [x] T5. Verificación: `tsc --noEmit`/build del cliente + navegación en navegador con dropdown poblado.
- [x] T6. Contrato del PUT: `use-update-student.ts` arma el body solo con los 6 campos del DTO
      (sin `documentNumber`/`courseId`) y omite `tutorEmail` vacío; `use-create-student.ts`
      omite `tutorEmail` vacío (igual 400 en alta).
- [x] T7. `student-form.tsx`: con `isEditing` los campos DNI y curso quedan `disabled` (solo lectivo).

## Criterios de aceptación
- El selector de cursos muestra los 3 cursos en crear, editar y matricular.
- `Nuevo Estudiante` y `Editar` abren modales sin perder la lista de atrás; Esc/cierre vuelven atrás.
- Guardar la edición responde `200` (no `400`) y persiste los cambios.
- El build del cliente compila.

## Forecast de entrega
- Estimado ~300-350 líneas cambiadas (add+del, sin contar el fix del dropdown). Bajo el umbral
  de 400 → un solo slice, sin cadena de PRs. Estrategia: `ask-on-risk`.

## Progress
- [x] Investigación (causa raíz verificada con evidencia de API + código)
- [x] Diseño aprobado por el usuario
- [x] T1..T5 — dropdown + modales crear/editar (delegado, verificado)
- [x] T6..T7 — contrato del PUT + DNI/curso solo lectivo (delegado, verificado)
- Próximo paso: decisión de commit del usuario (el árbol mezcla trabajo propio del usuario)

## Verificación (evidencia)
- `npx tsc --noEmit` (apps/client) → exit 0; (apps/api) → exit 0.
- `npx jest` (apps/api) → 51 suites / 268 tests / 0 fallos (corrido tras normalizar con biome).
- Verificador independiente (agente `general`, solo lectura) → `pass` en 8/8 checks.
- E2E Playwright contra `localhost:3000` (imagen `vir-ttend_client` reconstruida):
  - crear abre modal interceptado: `url=/students/create`, `dialog=1` → PASS
  - dropdown: `n=3 ['6° 1 - MORNING', '1° 1 - AFTERNOON', '4° 2 - MORNING']` → PASS
  - Esc cierra: `url=/students`, `dialogs=0` → PASS
  - Editar desde el menú de fila: `url=/students/<id>?edit=true`, `dialog=1` → PASS (path legacy OK)
- Tras T6/T7 (imagen `vir-ttend_client` reconstruida de nuevo), E2E final → **8/8 PASS, 0 respuestas 4xx**:
  - `DNI disabled=True`, `course select disabled=True`
  - `edit save: dialog cerrado, sin errores PUT` (antes: `400 documentNumber/courseId/tutorEmail`)
  - crear modal `url=/students/create dialog=1`, dropdown `n=3`, Esc → `dialogs=0`
- `npx vitest run src/features/students/use-update-student.test.tsx` (packages/hooks) → 1 archivo / 2 tests OK.
- `npx tsc --noEmit` → apps/client exit 0, packages/hooks exit 0.
- `npx biome check` (solo lectura) → students del cliente (6) y de hooks (9) y `student-form.tsx` (1): 0 issues.
- Incidente: un escritor delegado corrió Prettier sobre `apps/api` (526 archivos tabs→espacios);
  revertido con `pnpm lint:fix` + `git checkout` de los archivos solo-formato. `git status`
  volvió de 542 a 47 entradas.
