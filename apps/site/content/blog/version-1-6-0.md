---
title: "Versión 1.6.0 · Docentes por comisión y materias teóricas en 7° año"
date: 2026-11-03
version: 1.6.0
summary: "Cada comisión de un taller puede tener su propio docente, las materias teóricas de 7° año técnico cuentan como días de taller y la asistencia de taller deja de ofrecer \"Taller no dictado\" los días sin taller."
tags: [docentes, taller, asistencia]
---

## Un docente por comisión

- Un **taller** que se dicta en dos comisiones puede tener **un docente distinto en cada una**.
- Al crear o editar la materia, los **administradores** eligen **Mismo docente para ambas comisiones** o **Un docente por comisión**. La opción aparece en los talleres de cursos con dos comisiones.
- Cada docente ve y toma asistencia **solo de los alumnos de su comisión**.
- La lista de materias y el horario muestran el docente de cada comisión.
- Las materias que ya tenían docente lo conservan, como docente para ambas comisiones.

## Materias teóricas en 7° año técnico

- Los 7° años técnicos pueden tener **materias teóricas que se dictan en el turno de taller**.
- Sus horarios cuentan como **días de taller** para las dos comisiones: la asistencia la toma el **preceptor de taller**, y la inasistencia sigue contando como 1 falta.
- Esas materias **no tienen asistencia por materia**: la web y la app móvil muestran un aviso en lugar de la lista de alumnos.

## Taller no dictado solo cuando hay taller

- En la asistencia de taller, el botón **Taller no dictado** ya no aparece los días en los que la comisión no tiene taller según el horario. En su lugar se lee **No corresponde taller este día**.
- Si la comisión no tiene horario de taller cargado, se avisa que no se puede saber qué días tiene taller, con un enlace para cargarlo.
- También en la **app móvil**.

## Actualizaciones más seguras

- Antes de cada actualización se guarda una **copia de seguridad** de la base de datos, para poder volver atrás si algo falla.
