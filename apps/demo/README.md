# Vir-ttend — Demo App de Ventas (`apps/demo`)

Aplicación autocontenida para demostraciones comerciales con prospectos y directivos escolares. Permite recorrer el 100% de los flujos visuales del MVP con datos deterministas precargados, **sin base de datos, sin red y sin infraestructura**.

---

## Características

- **UI 100% real:** Reutiliza los componentes del sistema de diseño y layouts de producción (`@repo/ui` y `@repo/common`).
- **Store local determinista:** Memoria reactiva con persistencia en `localStorage` bajo clave versionada (`virttend-demo-state:v1`).
- **Selector de roles ("Entrar como..."):** Perfiles preconfigurados para Superadmin, Administrador, Preceptor y Docente.
- **Role Switcher flotante:** Permite saltar entre perfiles en cualquier pantalla sin perder el contexto.
- **Botón "Reset demo":** Restaura inmediatamente el estado determinista canónico en cualquier momento.

---

## Perfiles sembrados

| Perfil | Nombre | Rol | Institución | Caso de uso principal |
|---|---|---|---|---|
| **Superadmin** | Carlos Ramos | `SUPERADMIN` | Plataforma global | Gestión de sedes/tenants y métricas globales |
| **Admin** | Ana María Gómez | `ADMIN` | Inst. San Martín | Gestión de cursos, materias, usuarios y comunicados |
| **Preceptor Primaria** | Roberto López | `PRECEPTOR` | Inst. San Martín | Asistencia diaria de 1º Grado A y alertas tempranas |
| **Preceptor Secundaria** | Laura Martínez | `PRECEPTOR` | Inst. San Martín | Asistencia por materia de 3º Año A, justificaciones y reportes |
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
4. Variable de entorno opcional: `NEXT_PUBLIC_SITE_URL` con la URL pública del sitio (destino de «Conocé Vir-ttend»; por defecto el placeholder `https://vir-ttend.vercel.app`). Se lee en el build: al cambiarla hay que redesplegar.
5. **Deploy**, y cargá la URL resultante como `NEXT_PUBLIC_DEMO_URL` en el proyecto del sitio.

---

## Módulos y rutas cubiertas

- `/`: Selector de rol ("Entrar como...") con enlace al sitio público
- `/dashboard`: Panel de control adaptativo según rol (métricas, alertas, cursos)
- `/students`: Listado de alumnos con filtros, detalle `/students/[id]`, alta y edición
- `/courses`: Cursos académicos, creación `/courses/create` y detalle `/courses/[id]`
- `/subjects`: Materias y asignación de docentes por curso
- `/attendance`: Asistencia diaria (`/attendance/daily`) y por materia (`/attendance/subject`) con justificaciones y copiado de fechas
- `/alerts`: Bandeja de alertas de inasistencia con marcas de lectura
- `/announcements`: Publicación de anuncios institucionales con segmentación por audiencia
- `/reports`: Reporte mensual de asistencia (`/reports/monthly`) con gráficos de tendencia y exportación simulada
- `/users`: Gestión de cuentas de usuario, asignación de roles y estados
- `/tenants`: Gestión de instituciones educativas (restringido a Superadmin)
- `/me`: Perfil de usuario con cambio de contraseña simulado
