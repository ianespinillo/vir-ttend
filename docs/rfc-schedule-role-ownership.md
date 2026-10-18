# RFC: Gestión de horarios — Roles ADMIN vs PRECEPTOR

**Estado:** Aprobado / Implementado (Opción A — Shared write)  
**Fecha:** 2026-10-16  
**Contexto:** Decisión de diseño y permisos de dominio

---

## Situación actual

El horario de un curso (schedule slots: materia + docente + bloque) es gestionado exclusivamente por `ADMIN`. El preceptor solo tiene acceso de lectura, implícito a través de la toma de asistencia por materia.

## Problema identificado

En la operatoria real de las escuelas target, el preceptor recibe el horario del directivo y lo ejecuta. Sin embargo, hay casos donde el preceptor necesita reflejar cambios operativos (suplencias, permutas de bloques) que hoy no puede registrar sin escalar al admin.

## Opciones evaluadas

### Opción A — Shared write
Ambos roles pueden crear y modificar horarios sin restricción.

- ✅ Simple de implementar
- ❌ Sin trazabilidad clara de quién modificó qué y por qué
- ❌ Riesgo de inconsistencia entre cursos

### Opción B — Split por tipo de cambio (recomendada tentativamente)
- `ADMIN`: define la estructura base del horario (materia + docente + bloque, cambios permanentes)
- `PRECEPTOR`: registra ajustes operativos puntuales dentro del marco definido (ej: suplente en un bloque, permuta de día)

- ✅ Refleja el flujo real del rol
- ✅ Auditoría por intención del cambio
- ✅ No rompe invariantes de estructura académica
- ❌ Requiere distinguir en el modelo qué es "estructura" vs "excepción operativa"

## Pregunta abierta

¿Los cambios que haría el preceptor son **permanentes** (reestructuran el horario base) o son **excepciones puntuales** que no modifican la definición canónica del horario?

La respuesta define si alcanza con Opción B o si hay que modelar un concepto nuevo (ej: `ScheduleOverride` o `ScheduleException`).

## Resolución y Decisión

Se implementó la **Opción A (Shared write)**:
- Backend: el endpoint `POST /schedule` admite los roles `ADMIN` y `PRECEPTOR`.
- Frontend: el preceptor tiene permisos de gestión sobre la grilla de horarios del curso (`ScheduleGrid` y `ScheduleModal`) tanto en la app web de producción como en la demo.
- Los controles de integridad de horarios (no superposición de franjas, carga horaria semanal y comisiones de taller) se mantienen activos e invariantes en la capa de dominio (`ScheduleService` / `CourseService`).
