# Rediseño del form de estudiantes (asistente de 2 pasos)

## Objetivo
Reemplazar el form actual de alumnos —dos `Card` apiladas dentro del dialog, 8 campos
de una, sin jerarquía— por un asistente de 2 pasos con un solo surface.

## Problema / Por qué
Reporte del usuario (2026-10-08): "rediseña el form, se ve mal, hacelo two-step o algo
más eficaz que consideres".
Estructura medida: `DialogContent` (768×790, ya con borde/fondo/`p-6`) + **2 `Card`
apiladas** (cada una con su propio header y borde) = doble marco + cromo vertical
redundante; los 8 campos de una vuelta sin agrupación semántica.

## Diseño aprobado (autoría delegada por el usuario: "que consideres")
- Asistente 2 pasos: **1 · Estudiante** (Nombre, Apellido, DNI, Nacimiento + Asignación/Curso)
  → **2 · Tutor responsable** (Nombre completo, Teléfono, Email).
- **Un solo surface**: sin `Card` interna cuando el form vive en un dialog (el dialog ya es
  superficie); `variant="page"` mantiene la `Card` para la vista full-page (demo/fallback).
- Indicador de pasos con labels (no solo números): nodo completado = check, activo = primario,
  inactivo = muted, con conector. Es el elemento "signature".
- **Una sola instancia de `useForm`**: avanzar/retroceder no pierde datos ni revalida todo.
- Gate de avance: `await form.trigger(STEP1_FIELDS)` (verificado: RHF 7.71.1 con
  `zodResolver` 3.10.0 devuelve `!fieldNames.some(...)` → solo evalúa los campos pedidos,
  aunque el resolver devuelva errores de otros campos).
- `errorField?: keyof CreateStudentFormValues`: si el servidor señala un campo (p. ej.
  409 de DNI), el form salta al paso que lo contiene y muestra el banner ahí.
- Footer por paso: `Cancelar` + `Siguiente` → `Atrás` + `Crear Estudiante`/`Guardar cambios`.
- Copy en sentence case, sin mayúsculas de título en los labels de campo.

## Alcance
- T1. `packages/ui/.../students/student-form.tsx`: wizard de 2 pasos, indicador inline
      (sin crear Stepper compartido → no hay segundo consumidor), gate con `trigger`,
      footer por paso, banner de `errorMessage` visible en ambos pasos.
- T2. `student-form.tsx`: prop `variant?: 'page' | 'dialog'` (default `page`) y
      `errorField?` con salto de paso.
- T3. Callers de dialog: `students/@modal/(.)create/page.tsx` y `students/[id]/page.tsx`
      → `variant="dialog"` + `errorField` en el 409/400 relevante.
- T4. Verificación: `tsc --noEmit` (client + demo), `biome check` (solo lectura), E2E
      con capturas antes/después.

## Fuera de alcance
- Componente `Stepper` compartido en `packages/ui` (sin otro consumidor).
- Cambios de API/DTO (el contrato del PUT ya quedó fijo en la tarea anterior).
- Rediseño de otros formularios (usuarios, comunicados, cursos).

## Restricciones
- No commitear (árbol mezcla trabajo propio del usuario).
- Tabs + LF (biome); **nunca** correr Prettier sobre el repo.
- No tocar `apps/api`.

## Criterios de aceptación
- Crear: no se avanza del paso 1 si falta un campo obligatorio (los mensajes se ven en el paso 1).
- Retroceder conserva todo lo tipeado en el paso 1.
- Editar: DNI y curso quedan deshabilitados en el paso 1; guardar responde `200` y cierra.
- El dialog no tiene doble borde (una sola superficie) y mide < 790px de alto.
- `tsc --noEmit` en apps/client y apps/demo → 0; `biome check` → 0 issues.

## Forecast de entrega
- ~250-350 líneas cambiadas en 3 archivos. Bajo el umbral de 400 → un solo slice.
- Estrategia: `ask-on-risk` (RDD off → sin ciclo de review nativo).

## Progress
- [x] Investigación (2 codegraph_explore + verificación de `trigger()` en el código instalado)
- [x] Diseño presentado al usuario (autoría delegada: "que consideres")
- [x] T1..T2 — wizard + props en `student-form.tsx` (delegado; 241 → 370 líneas)
- [x] T3 — callers de dialog (`@modal/(.)create` + `[id]/page.tsx`: `variant="dialog"` + `errorField`)
- [x] T4 — verificación (rebuild de la imagen + E2E con capturas) → **16/16 PASS**
- Próximo paso: decisión de commit del usuario (árbol mezcla trabajo propio del usuario)

## Estado de la verificación intermedia
- `npx tsc --noEmit` (apps/client) → exit 0.
- `npx biome check` sobre los 3 archivos → exit 0 (sin fixes pendientes).
- `npx tsc --noEmit` (apps/demo) → **1 error preexistente y ajeno**:
  `src/lib/store/seed-data.ts(648,3) TS2741: Property 'nonWorkingDays' is missing`.
  Confirmado: `packages/common/src/types/academic/academic-year.response.type.ts` está
  modificado en el árbol del usuario (agregó `nonWorkingDays`) y el seed del demo no lo
  sigue; ninguno de los 3 archivos tocados emite errores. **Fuera del alcance de esta tarea.**
- Confirmado que `git status` = 47 modificados + 14 sin trackear (61); no entró ningún
  archivo fuera de los 3 previstos (el `@modal/(.)create/page.tsx` no aparece en
  `git diff` porque es un archivo nuevo sin trackear).

## Verificación E2E (imagen `vir-ttend_client` reconstruida, `sha256:3a77da85…`)
- **16/16 PASS, exit 0, cero respuestas 4xx de la API** (`wizard_check.py`, Playwright):
  - `create step1 abierto`: `url=/students/create`, `dialogs=1`
  - `altura paso 1 < 790` y `altura paso 2 < 790` → paso 2 midió **371px** (antes 790)
  - `sin Card anidada en dialog` (el título «Datos personales del estudiante» no existe
    dentro del dialog → un solo surface)
  - `gate bloquea vacío`: no avanza y pinta errores — probe confirmó
    `aria-invalid="true"` + **10** elementos `.text-destructive` con los mensajes del
    schema (`El nombre es obligatorio`, `Debe seleccionar un curso válido`, …)
  - `dropdown cursos paso1`: `n=3`
  - `avanza al paso 2`: tutor visible + campos del paso 1 desmontados
  - `atrás conserva datos`: `firstName=Prueba`, `dni=99887766` (misma instancia de form)
  - `Esc cierra` → `dialogs=0`
  - `edit paso1` + `DNI disabled` + `curso disabled`
  - `edit llega a paso 2` → `edit guardar`: `dialog_abierto=0`, `put_errors=[]` (200)
- Un primer intento falló por **bug del selector del test** (`div/span.text-destructive`
  no matchea el `<p>` de `FormMessage`), no del producto: corregido a `.text-destructive`.
- Capturas: `after_create_step1.png`, `after_create_gate.png`,
  `after_create_step1_filled.png`, `after_create_step2.png`, `after_edit_step1.png`,
  `after_edit_saved.png` (en el temp dir de la sesión; el modelo no puede ver imágenes,
  las revisa el usuario).
- No se completó el submit de **creación** a propósito: habría insertado un alumno de
  prueba en la DB; el camino de submit está cubierto por la edición (200).

## Intento de verificación de la variante `page` (gap honesto)
- Hard-load de `/students/create` rebota a `/dashboard`: **bounce global preexistente de
  navegación directa** (ya observado en `/courses` y `/settings/*`, rutas nunca tocadas
  en esta feature → no es de esta feature). Cadena descartada: `middleware.ts` solo
  redirige sin sesión; el guard de `(dashboard)/layout.tsx` renderiza `<Forbidden>` sin
  redirigir; `students/create/page.tsx` solo hace `push('/students')` en cancel/submit; y
  `students/layout.tsx` (creado en la tarea anterior) **no contiene redirects** (grep = 0
  matches). El usuario lo marcó fuera de alcance ("ya fixee eso").
- `apps/demo` (el otro consumidor de `variant="page"`) no está corriendo y su build está
  roto por el cambio propio del usuario (`nonWorkingDays` sin propagar a `seed-data.ts`).
- Evidencia estática: `variant` solo cambia el wrapper (`student-form.tsx` 354-369:
  `page` → `Card` con `STEP_TITLES[step]`, `dialog` → `body` pelado); `body`, gate y
  footers son exactamente los mismos del flujo verificado E2E 16/16. `tsc` + `biome` pasan.
- **Gap**: la variante `page` quedó sin verificación en vivo en este entorno (no era
  criterio de aceptación; la superficie primaria es el dialog).

## Verificación (evidencia)
- `@hookform/resolvers@3.10.0` `zod.js` leído: valida el objeto completo, no filtra por `names`.
- `react-hook-form@7.71.1` `dist/index.esm.mjs` leído:
  `validationResult = name ? !fieldNames.some((name) => get(errors, name)) : isValid`
  → el gate por campo es correcto.
- Capturas de línea base: `before_create_modal.png`, `before_edit_modal.png`
  (dialog 768×790, sin scroll interno a 1440×900).
