# Vir-ttend — Demo App de Ventas (`apps/demo`)

Aplicación autocontenida para demostraciones comerciales con prospectos y directivos escolares. Permite recorrer el 100% de los flujos visuales del MVP con datos deterministas precargados, **sin base de datos, sin red y sin infraestructura**.

---

## Características

- **UI 100% real:** Reutiliza los componentes del sistema de diseño y layouts de producción (`@repo/ui` y `@repo/common`).
- **Store local determinista:** Memoria reactiva con persistencia en `localStorage` bajo clave versionada (`virttend-demo-state:v2`). Un estado guardado con un esquema anterior (`:v1`) se descarta y se limpia solo: la demo vuelve a sembrarse.
- **Selector de roles ("Entrar como..."):** Perfiles preconfigurados para Superadmin, Administrador, Preceptor y Docente.
- **Role Switcher flotante:** Permite saltar entre perfiles en cualquier pantalla sin perder el contexto.
- **Botón "Reset demo":** Restaura inmediatamente el estado determinista canónico en cualquier momento.
- **Modo oscuro:** Selector de tema (claro / oscuro / sistema) en la barra superior, igual que producción.
- **Tour y tutoriales guiados:** Recorrido inicial por rol y guías funcionales (asistencia diaria, alta e importación de alumnos, historial, ciclo lectivo, comunicados) desde el selector de guías.

---

## Perfiles sembrados

| Perfil | Nombre | Rol | Institución | Caso de uso principal |
|---|---|---|---|---|
| **Superadmin** | Carlos Ramos | `SUPERADMIN` | Plataforma global | Gestión de sedes/tenants y métricas globales |
| **Admin** | Ana María Gómez | `ADMIN` | Inst. San Martín | Gestión de cursos, materias, usuarios y comunicados |
| **Preceptor Primaria** | Roberto López | `PRECEPTOR` | Inst. San Martín | Asistencia diaria de 1º Grado A y alertas tempranas |
| **Preceptor Secundaria** | Laura Martínez | `PRECEPTOR` | Inst. San Martín | Asistencia diaria de 3º Año A, comisión de taller 1 de 3º y 7º Año A, justificaciones y reportes |
| **Preceptor de taller** | Marcelo Torres | `PRECEPTOR` | Inst. San Martín | Asistencia de taller de la comisión 2 (3A2 y 7A2) |
| **Docente Matemática** | Javier Pérez | `TEACHER` | Inst. San Martín | Toma de asistencia en Matemática (3º Año A) |
| **Docente Historia** | Elena Fernández | `TEACHER` | Inst. San Martín | Toma de asistencia en Historia (3º Año A) |

*Contraseña demo informativa:* `Demo1234!`

---

## Cómo ejecutar la app

### Modo desarrollo
```bash
# Desde la raíz del monorepo
pnpm --filter demo dev
```
La aplicación iniciará en `http://localhost:3000` (o el puerto configurado por Next.js).

### Ejecutar tests unitarios e integración
```bash
pnpm --filter demo test
```

### Chequeo de tipos TypeScript
```bash
pnpm --filter demo ts:check
```

### Build de producción
```bash
pnpm --filter demo build
```

---

## Despliegue en Vercel

La landing y las preguntas frecuentes viven en `apps/site`; la demo arranca directamente en el selector de rol (`/`). Como el sitio, la demo no usa backend ni `output: 'standalone'`.

`apps/demo/vercel.json` instala desde la raíz del monorepo y compila las dependencias del workspace antes de la demo:

- `installCommand`: `cd ../.. && pnpm install --frozen-lockfile`
- `buildCommand`: `cd ../.. && pnpm turbo run build --filter=demo...`

Pasos:

1. En Vercel: **Add New > Project** e importá el repositorio (un proyecto distinto al del sitio).
2. **Root Directory**: `apps/demo`, con **Include source files outside of the Root Directory in the Build Step** activo (valor por defecto).
3. **Framework Preset**: Next.js. No sobrescribas los comandos de instalación y build: salen de `vercel.json`.
4. Variable de entorno opcional: `NEXT_PUBLIC_SITE_URL` con la URL pública del sitio (destino de «Conocé Vir-ttend»; por defecto `https://virttend.app`). Se lee en el build: al cambiarla hay que redesplegar.
5. **Deploy**, y cargá la URL resultante como `NEXT_PUBLIC_DEMO_URL` en el proyecto del sitio.

---

## Módulos y rutas cubiertas

- `/`: Selector de rol ("Entrar como...") con enlace al sitio público
- `/dashboard`: Panel de control adaptativo según rol (métricas, alertas, cursos)
- `/students`: Listado de alumnos con filtros, detalle `/students/[id]`, alta y edición
- `/courses`: Cursos académicos, creación `/courses/create` y detalle `/courses/[id]` (materias, horario por comisión, alumnos del curso, comisiones de taller e importación de alumnos)
- `/subjects`: Materias y asignación de docentes por curso
- `/attendance`: Asistencia diaria (`/attendance/daily`), por materia (`/attendance/subject`) y de taller por comisión (`/attendance/workshop`) con justificaciones, revisión de justificaciones y copiado de fechas
- `/attendance/student/[id]`: Historial del alumno (métricas ponderadas, comparativa alumno vs. curso, asistencia por materia, alertas) con exportación simulada
- `/settings/academic`: Ciclo lectivo y días no laborables (declarar un día publica el comunicado institucional)
- `/alerts`: Bandeja de alertas de inasistencia con marcas de lectura
- `/announcements`: Publicación de anuncios institucionales con segmentación por audiencia
- `/reports`: Reporte mensual de asistencia (`/reports/monthly`) con gráficos de tendencia y exportación simulada
- `/users`: Gestión de cuentas de usuario, asignación de roles y estados
- `/tenants`: Gestión de instituciones educativas (restringido a Superadmin)
- `/me`: Perfil de usuario con cambio de contraseña simulado

---

## Datos sembrados que conviene mostrar

El «hoy» de la demo es fijo (**19/06/2026**) y las pantallas de asistencia abren en esa fecha. El historial cubre 60 días hábiles.

| Qué mostrar | Dónde | Dato sembrado |
|---|---|---|
| Alertas a las 10 y 20 faltas y al tope (28) | `/alerts`, ficha del alumno | Sofía Rossi y Joaquín Díaz (3º A), Emma Villalba (1º Grado: advertencia, crítica y excedida), Daniela Escobar y Kevin Maidana (7º A) |
| Faltas ponderadas (tarde 0,25; tarde fuera de tolerancia 0,5) | `/attendance/student/[id]` | Thiago Medina alcanza 10 faltas solo con tardanzas |
| Mitad de falta por turno en contraturno | Historial de Camila Sosa y Benjamín Vega | «turno 1,5 · taller 1,5» |
| Curso técnico de 7º año solo de taller | `/courses/[id]` de 7º Año A, `/attendance/daily` | Dos comisiones (7A1, 7A2), sin asistencia diaria |
| Asistencia de taller por comisión | `/attendance/workshop` | Admin ve todas las comisiones; Laura Martínez ve 3A1 y 7A1; Marcelo Torres ve 3A2 y 7A2 |
| Docentes sin cuenta y materias de taller | `/courses/[id]` > Materias | Daniel Ortega, Roberto Sáenz y Marta Quiroga |
| Día no laborable declarado con comunicado | `/settings/academic`, `/me/announcements` | 12/06/2026 «Jornada institucional» |
| Estados «Tarde (fuera de tolerancia)» y «Justificada» | Asistencia diaria de 1º Grado A / 3º Año A | Bruno Álvarez, Mateo Giménez, Lucía Morales |

## Diferencias con producción

- La importación de alumnos (curso > pestaña Estudiantes > «Importar alumnos») valida un **CSV** (plantilla descargable) con las mismas reglas que producción; con cualquier otro archivo (p. ej. `.xlsx`) muestra una planilla de ejemplo para poder completar el flujo sin preparar un archivo.
- La exportación de reportes e historiales es simulada (aviso, sin archivo).
- Los docentes de taller sin cuenta se muestran por nombre; no tienen perfil de ingreso.
