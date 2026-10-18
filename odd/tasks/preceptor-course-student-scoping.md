# Scope de cursos y estudiantes para rol PRECEPTOR

## Objetivo
Garantizar que desde la cuenta de un preceptor:
1. En **Cursos** (`/courses`) solo se listen los cursos asignados al preceptor autenticado (tanto por API como en UI).
2. En **Estudiantes** (`/students`) el dropdown de cursos solo muestre los cursos del preceptor, y el listado de estudiantes solo devuelva alumnos de sus cursos asignados (cuando no filtra por curso y cuando filtra por alguno de sus cursos).

## Causa raíz (verificada)
1. **API `GET /courses`** (`course.controller.ts:132`):
   - Acepta `ROLES.ADMIN` y `ROLES.PRECEPTOR`.
   - Lee `@Query('preceptorId') preceptorId?: string` pero no inyecta `@CurrentUser() user`.
   - Si no se envía `preceptorId`, el handler devuelve **todos** los cursos del año académico sin restringir al preceptor logueado.
2. **API `GET /students`** (`students.controller.ts:157`):
   - Acepta `ROLES.ADMIN` y `ROLES.PRECEPTOR`.
   - Pasa `courseId` a `GetStudentsByCourseQuery`, pero si `courseId` es undefined devuelve todos los estudiantes del tenant.
   - No verifica si el preceptor tiene asignado ese `courseId`, ni acota por los cursos del preceptor cuando `courseId` no viene.
3. **API `GET /students/search`** (`students.controller.ts:217`):
   - Busca en todo el tenant sin filtrar por los cursos del preceptor.
4. **Frontend `/courses`** (`courses/page.tsx:45`):
   - Define `isPreceptor` pero nunca lo usa; llama a `useCourses(filterParams)` sin pasar `preceptorId`.
5. **Frontend `/students`** (`students/page.tsx:41`):
   - Llama a `useCourses({ academicYearId: activeYear?.id })` sin filtrar por preceptor.
6. **Demo `/students`** (`apps/demo/.../students/page.tsx:37`):
   - `selectors.getCourses(state)` sin acotar por `getScopedCourseIds`.

## Alcance
- **API (Academic Module)**:
  - En `CourseController.list`: si `user.role === ROLES.PRECEPTOR`, forzar `preceptorId = user.sub`.
  - En `StudentRepository.search`: dar soporte a `courseIds?: string[]` para filtrar por múltiples cursos (`$in`).
  - En `GetStudentsByCourseHandler`: si el actor es `PRECEPTOR`, acotar la búsqueda a sus cursos asignados (o al `courseId` solicitado si le pertenece; si no le pertenece o no tiene cursos, retornar vacío).
  - En `SearchStudentsHandler`: si el actor es `PRECEPTOR`, acotar la búsqueda a sus cursos asignados.
  - Tests unitarios en `apps/api/test/unit/academic`.
- **Frontend (`apps/client`)**:
  - En `courses/page.tsx`: pasar `preceptorId: isPreceptor ? user?.id : undefined`.
  - En `students/page.tsx`: pasar `preceptorId: isPreceptor ? user?.id : undefined` a `useCourses`.
- **Demo (`apps/demo`)**:
  - En `students/page.tsx`: acotar cursos y estudiantes usando `getScopedCourseIds`.

## Tareas
- [x] T1: Backend `CourseController.list` - Enforzar preceptorId para `ROLES.PRECEPTOR`.
- [x] T2: Backend `StudentRepository` + `GetStudentsByCourseHandler` + `SearchStudentsHandler` - Filtrar estudiantes por cursos del preceptor.
- [x] T3: Tests unitarios de API para T1 y T2.
- [x] T4: Frontend `apps/client` (`/courses` y `/students`).
- [x] T5: Demo `apps/demo` (`/students`).
- [x] T6: Verificación completa (typecheck, tests, build).
