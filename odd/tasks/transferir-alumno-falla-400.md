# Transferir alumno falla (400 silencioso)

## Objective
La transferencia de alumnos desde la UI fallaba: el modal se quedaba abierto sin ningún mensaje.

## Root cause (cadena completa)
1. `POST /students/:id/transfer` (API) exige `newCourseId` (`TransferStudentRequestDto`, `@IsUUID`).
2. El código committed del cliente mandaba `data: { targetCourseId }`:
   - `apps/client/src/app/(dashboard)/students/page.tsx` → `data: { targetCourseId }`
   - `apps/client/src/app/(dashboard)/students/[id]/page.tsx` → `data: { targetCourseId }`
   - `packages/hooks/src/features/students/use-transfer-student.ts` → postea `data` verbatim
3. → class-validator rechaza → **400**.
4. El modal no captura el rechazo (`handleModalSubmit` tiene try/finally sin catch) → sin toast, todo silencioso.
5. El working tree YA tenía el fix (páginas → `{ newCourseId }`; hook normaliza `newCourseId ?? targetCourseId`) pero el container `vir-ttend_client` corría un build horneado de 18 h (Dockerfile de cliente = standalone, sin volumen) → el fix nunca llegó a la app.

## Fix aplicado
- `docker compose build client && docker compose up -d client` → publica el fix del working tree.
- Imagen nueva (evidence): `sha256:baaadc4ae2463bbc93379a0746eb7591dbabf7b34c6af1d9a8b329e93baf901a`.

## Verificación (live, Playwright headless)
- Antes: body del request = `{"targetCourseId":"aacac20a-a8d0-4376-8595-a961710cd692"}` → **400**, modal abierto, sin toast.
- Después del rebuild: body = `{"newCourseId":"aacac20a-a8d0-4376-8595-a961710cd692"}` → **201**, modal cerrado, fila → "Transferido".
- API cruda con `newCourseId` → 201 (ya funcionaba).
- `pnpm --filter client ts:check` → 0 errores (valida el WIP del working tree compila).
- Test student "Pepe flores" (`cf26487e-97d8-4e27-b5ef-8bd8cf12dd53`) restaurado a curso `1d4eb30f-10b1-4ab0-b7b9-a72463fac51c` + `ACTIVE`.

## Hallazgos secundarios
- La lista `GET /students` NO incluye `courseId`/`courseName` (DTO de lista; diseño, no bug).
- El badge de estado mapea claves en mayúscula (`ACTIVE`); un status en minúscula escrito por SQL directo muestra fallback "Inactivo".
- UX gap: ninguna mutación del modal de estudiantes muestra toast de error (solo se cierra con éxito).

## Next steps / pendientes
- Cuando el user commitee: incluir `students/page.tsx`, `students/[id]/page.tsx`, `use-transfer-student.ts` (el fix está solo en working tree; el código committed sigue mandando `targetCourseId`).
- Opcional: agregar toast de error en `handleModalSubmit` (StudentsPage y [id]/page.tsx) ante rechazo de la mutación.
- `apps/demo` replica el mismo feature transfer (fuera de alcance; tsc error user's in-flight).