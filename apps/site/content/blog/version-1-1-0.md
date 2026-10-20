---
title: "Versión 1.1.0 · Talleres, importación de alumnos y mejores reportes"
date: 2026-10-16
version: 1.1.0
summary: "Carga masiva de alumnos desde Excel, asistencia de taller por comisión para escuelas técnicas, historial por alumno y días no laborables con aviso automático."
tags: [alumnos, talleres, reportes]
---

Esta versión reúne mejoras para cargar menos datos a mano, conocer mejor la trayectoria de cada alumno y dar soporte a la organización de las escuelas técnicas.

## Alumnos

- **Importación masiva desde Excel**: se descarga una planilla modelo, se completa con los alumnos del curso y se sube de una vez. El sistema revisa los datos antes de guardar.
- **Historial y métricas por alumno**: una pantalla con su porcentaje de asistencia, la evolución mes a mes, la comparación con el promedio del curso, el detalle por materia, sus alertas y el historial completo. El legajo se puede exportar a Excel o PDF con el nombre del alumno.
- En cada curso, la pestaña de alumnos ahora lista a los estudiantes que lo integran.

## Talleres en escuelas técnicas

- **Comisiones de taller**: cada curso se divide en comisiones que cursan el taller en el turno opuesto, con un preceptor de taller por comisión.
- **Asistencia de taller por comisión**, tanto en la web como en la app móvil.
- Las materias pueden marcarse como de taller y los horarios asignarse a una comisión.

## Cómputo de inasistencias y alertas

- Las inasistencias se **ponderan según las reglas de cómputo** (por ejemplo, el contraturno), y los reportes muestran el total ponderado y el porcentaje de asistencia sobre las clases dadas.
- Nuevo estado de **llegada tarde fuera de tolerancia**.
- Las alertas se generan al llegar a **10 y 20 inasistencias y al tope**, sin duplicados ni avisos transitorios.
- Las alertas marcadas como vistas ya no vuelven a aparecer como nuevas.

## Reportes

- El **Excel de asistencia** se ve más prolijo y detalla las inasistencias ponderadas.
- La **planilla modelo de alumnos** tiene un formato más claro.
- Se corrigió el formato del porcentaje de asistencia cuando no hay datos para calcularlo.

## Calendario escolar

- **Días no laborables** (feriados, paros, jornadas institucionales): al declararlos se puede **publicar automáticamente un comunicado** a toda la escuela con el motivo de la suspensión.
- Los preceptores pueden **gestionar los horarios de los cursos**.

## Más control y claridad

- En escuelas con instalación propia, **los administradores pueden crear y gestionar a otros administradores**, con la salvaguarda de que siempre quede al menos uno activo.
- Un **preceptor solo ve los cursos y alumnos que tiene asignados**.
- Los mensajes de error ahora aparecen en español y en lenguaje claro.
- El **nombre y el ícono de la pestaña** del navegador toman los de cada escuela.
- En la app móvil, la asistencia cargada sin conexión se reintenta correctamente si coincide con otro guardado, y justificar una ausencia vuelve a funcionar.
