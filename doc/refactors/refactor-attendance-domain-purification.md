# Refactor: Purificación del Domain Layer — Attendance Module

> **Fecha:** 2026-07-12
> **Estado:** Plan
> **Dependencias:** Sprint 08 (Alertas Automáticas)
> **Motivación:** Alinear el módulo attendance con el patrón DDD establecido en academic/identity

---

## 1. Problema actual

### Servicios de dominio con dependencias de infraestructura

El módulo **attendance** es el único del codebase que inyecta repositorios y puertos directamente en servicios de dominio. Los módulos **academic** e **identity** usan servicios de dominio puros (sin dependencias de repos/puertos).

| Servicio | Dependencias | ¿Es legítimo de dominio? |
|---|---|---|
| `AttendanceCalculationService` | `ISchedulePort`, `LatePolicyService`, `IAttendanceRecordRepository` | Parcial — `calculateAbscensePercent` sí, pero `calculateAbsencePercentForStudent` es orquestación de datos |
| `ThresholdCheckerService` | `AttendanceCalculationService`, `IAcademicYearPort` | No — solo compara un número contra umbrales |
| `AttendanceCopyService` | `IAttendanceRecordRepository` | No — pass-through literal al repo |
| `CourseSnapshotBuilderService` | `IAttendanceRecordRepository`, `ICoursePort` | No — orquestación de datos (fetch + build VO) |

### Código muerto

- `AttendanceCalculationService` **no está registrado** en ningún módulo NestJS
- `calculateAbscensePercent` (el método más complejo) **nunca se llama externamente**
- `ThresholdCheckerService` **no está registrado** en ningún módulo NestJS
- `CourseSnapshotBuilderService` tiene un import no utilizado de `AttendanceCalculationService`

### Bugs en `AlertType.fromPercent`

```ts
// Línea 12: 'critical' en vez de 'exceeded'
else return new AlertType('critical');

// Línea 9: lanza error en vez de retornar null
if (percent === 0) throw new Error('Not enough percent');
```

---

## 2. Principio rector

Los servicios de dominio contienen **solo lógica de negocio pura**:
- Reciben datos como parámetros
- No acceden a repositorios ni puertos de persistencia
- Pueden depender de **puertos de salida** que representan servicios externos (schedule, courses)
- El **fetching de datos** es responsabilidad de la **application layer** (handlers)

### Patrón establecido en el codebase

```
academic/domain/services/course.service.ts    → static methods, sin dependencias
academic/domain/services/schedule.service.ts  → static methods, sin dependencias
identity/domain/services/token.service.ts     → sin @Injectable, sin dependencias
identity/domain/services/password.service.ts  → sin @Injectable, sin dependencias
```

---

## 3. Arquitectura resultante

### Domain Layer (depurado)

```
domain/
├── entities/
│   ├── attendance-record.entity.ts          (sin cambios)
│   ├── attendance-alert.entity.ts           (+tenantId, alertType explícito)
│   ├── academic-year.entity.ts              (sin cambios)
│   ├── course.entity.ts                     (sin cambios)
│   ├── subject.entity.ts                    (sin cambios)
│   ├── student.ts                           (sin cambios)
│   └── schedule-slot.entity.ts              (sin cambios)
├── value-objects/
│   ├── alert-type.vo.ts                     (corregir bugs, +factories)
│   ├── attendance-record-id.vo.ts           (sin cambios)
│   ├── justification-reason.vo.ts           (sin cambios)
│   └── course-snapshot.vo.ts                (sin cambios)
├── services/
│   ├── attendance-calculation.service.ts    (-repo, -calculateAbsencePercentForStudent)
│   ├── threshold-checker.service.ts         (purificado: static check())
│   ├── late-policy.service.ts               (sin cambios)
│   └── justification.service.ts             (sin cambios)
├── ports/                                   (sin cambios)
├── repositories/                            (sin cambios)
└── events/                                  (sin cambios)
```

### Application Layer (con orquestación)

```
application/
├── commands/
│   ├── copy-attendance/
│   │   └── copy-attendance.handler.ts       (-AttendanceCopyService, +repo directo)
│   └── generate-alert/                      (NUEVO — Sprint 08)
│       ├── generate-alert.command.ts
│       └── generate-alert.handler.ts
├── queries/
│   ├── get-course-daily-overview/
│   │   └── get-course-daily-overview.handler.ts  (-CourseSnapshotBuilderService, +CourseSnapshotBuilder)
│   ├── get-preceptor-dashboard/
│   │   └── get-preceptor-dashboard.handler.ts    (-CourseSnapshotBuilderService, +CourseSnapshotBuilder)
│   └── get-dashboard-metrics/
│       └── get-dashboard-metrics.handler.ts      (-CourseSnapshotBuilderService, +CourseSnapshotBuilder)
├── services/
│   └── course-snapshot-builder.service.ts   (NUEVO — reemplaza CourseSnapshotBuilderService)
└── dtos/                                    (sin cambios)
```

### Archivos eliminados

| Archivo | Razón |
|---|---|
| `domain/services/attendance-copy.service.ts` | Pass-through literal al repo, sin lógica de negocio |
| `domain/services/course-snapshot-builder.service.ts` | Orquestación de datos → application layer |

### Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `application/services/course-snapshot-builder.service.ts` | Orquesta: busca course + summary data, construye `CourseSnapshot` |
| `application/commands/generate-alert/generate-alert.command.ts` | Sprint 08 |
| `application/commands/generate-alert/generate-alert.handler.ts` | Sprint 08 |

---

## 4. Cambios detallados por archivo

### 4.1 `domain/value-objects/alert-type.vo.ts`

**Problema:** Bugs en `fromPercent` y falta de factories estáticos.

**Cambios:**
- Corregir `fromPercent`: `else return new AlertType('critical')` → `'exceeded'`
- Corregir `fromPercent`: retornar `null` en vez de lanzar error cuando `percent < 50`
- Agregar factories estáticos: `warning()`, `critical()`, `exceeded()`

**Resultado:**

```ts
type Status = 'warning' | 'critical' | 'exceeded';

export class AlertType {
  private readonly _status: Status;

  private constructor(status: Status) {
    this._status = status;
  }

  static warning(): AlertType {
    return new AlertType('warning');
  }

  static critical(): AlertType {
    return new AlertType('critical');
  }

  static exceeded(): AlertType {
    return new AlertType('exceeded');
  }

  static fromPercent(percent: number): AlertType | null {
    if (percent >= 100) return new AlertType('exceeded');
    if (percent >= 75) return new AlertType('critical');
    if (percent >= 50) return new AlertType('warning');
    return null;
  }

  get status(): Status {
    return this._status;
  }
}
```

---

### 4.2 `domain/entities/attendance-alert.entity.ts`

**Problema:** Falta campo `tenantId` (listado en sprint doc). `create()` calcula `alertType` automáticamente via `AlertType.fromPercent`, pero el tipo debería ser determinado por `ThresholdCheckerService` y pasado explícitamente.

**Cambios:**
- Agregar `_tenantId: string` al constructor y como getter
- Modificar `CreateProperties` para incluir `tenantId` y `alertType` explícito
- `create()` ya no calcula `alertType` — recibe el tipo directamente
- `reconstitute()` recibe `alertType` directamente (no calcula)

**Resultado:**

```ts
import { AlertType } from '../value-objects/alert-type.vo';
import { randomUUID } from 'node:crypto';

interface ConstructorProperties {
  id: string;
  tenantId: string;
  studentId: string;
  courseId: string;
  academicYearId: string;
  alertType: AlertType;
  absencePercent: number;
  seenBy?: string;
  seenAt?: Date;
  createdAt: Date;
}

interface CreateProperties {
  tenantId: string;
  studentId: string;
  courseId: string;
  academicYearId: string;
  alertType: AlertType;
  absencePercent: number;
}

interface ReconstituteProperties extends CreateProperties {
  id: string;
  seenBy?: string;
  seenAt?: Date;
  createdAt: Date;
}

export class AttendanceAlert {
  private readonly _id: string;
  private readonly _tenantId: string;
  private readonly _studentId: string;
  private readonly _courseId: string;
  private readonly _academicYearId: string;
  private readonly _alertType: AlertType;
  private readonly _absencePercent: number;
  private readonly _createdAt: Date;
  private _seenBy?: string;
  private _seenAt?: Date;

  private constructor(props: ConstructorProperties) {
    Object.assign(props, this);
  }

  static create(props: CreateProperties): AttendanceAlert {
    return new AttendanceAlert({
      ...props,
      id: randomUUID(),
      createdAt: new Date(),
    });
  }

  static reconstitute(props: ReconstituteProperties): AttendanceAlert {
    return new AttendanceAlert(props);
  }

  markAsSeen(userId: string): void {
    this._seenBy = userId;
    this._seenAt = new Date();
  }

  get id(): string { return this._id; }
  get tenantId(): string { return this._tenantId; }
  get studentId(): string { return this._studentId; }
  get courseId(): string { return this._courseId; }
  get academicYearId(): string { return this._academicYearId; }
  get alertType(): AlertType { return this._alertType; }
  get absencePercent(): number { return this._absencePercent; }
  get seenBy(): string { return this._seenBy; }
  get seenAt(): Date { return this._seenAt; }
  get createdAt(): Date { return this._createdAt; }
}
```

---

### 4.3 `domain/services/threshold-checker.service.ts`

**Problema:** Servicio con dependencias inyectadas que solo compara un número contra umbrales.

**Cambios:**
- Eliminar `@Injectable()`, constructor, todas las dependencias
- Hacerlo una clase con un único método estático `check()`
- Recibe `absencePercent: number`, retorna `AlertType | null`

**Resultado:**

```ts
import { AlertType } from '../value-objects/alert-type.vo';

export class ThresholdCheckerService {
  /**
   * Determina el tipo de alerta basado en el porcentaje de ausencias.
   * @returns AlertType si supera un umbral, null si está dentro de los límites.
   */
  static check(absencePercent: number): AlertType | null {
    if (absencePercent >= 100) return AlertType.exceeded();
    if (absencePercent >= 75) return AlertType.critical();
    if (absencePercent >= 50) return AlertType.warning();
    return null;
  }
}
```

---

### 4.4 `domain/services/attendance-calculation.service.ts`

**Problema:** Depende de `IAttendanceRecordRepository` y tiene un método (`calculateAbsencePercentForStudent`) que es orquestación de datos, no lógica de dominio. El otro método (`calculateAbscensePercent`) nunca se llama externamente.

**Cambios:**
- Eliminar `IAttendanceRecordRepository` del constructor
- Eliminar el método `calculateAbsencePercentForStudent` (movido a application layer)
- Eliminar el import de `IAttendanceRecordRepository`
- `calculateAbscensePercent` y `getExpectedClassesForSubject` se mantienen — aplican reglas de negocio (late policy) sobre datos recibidos como parámetro

**Resultado:**

```ts
import { Injectable } from '@nestjs/common';
import { ATTENDANCE_STATUS, DAYOFWEEK } from '@repo/common';
import { AcademicYear } from '../entities/academic-year.entity';
import { AttendanceRecord } from '../entities/attendance-record.entity';
import { ISchedulePort } from '../ports/schedule.port.interface';
import { LatePolicyService } from './late-policy.service';

@Injectable()
export class AttendanceCalculationService {
  constructor(
    private readonly schedulePort: ISchedulePort,
    private readonly latePolicyService: LatePolicyService,
  ) {}

  async calculateAbscensePercent(
    records: AttendanceRecord[],
    academicYear: AcademicYear,
    from: Date,
    to: Date,
    subjectId?: string,
  ): Promise<number> {
    let expectedClasses = 0;
    if (subjectId) {
      expectedClasses = await this.getExpectedClassesForSubject(
        subjectId,
        from,
        to,
        academicYear.id,
      );
      if (expectedClasses === 0) return 0;
    }
    let total = 0;
    for (const record of records) {
      if (record.status === ATTENDANCE_STATUS.ABSENT) total++;
      else if (record.status === ATTENDANCE_STATUS.LATE) {
        const minutesLate = new Date(
          record.createdAt.getTime() - record.editedAt.getTime(),
        ).getMinutes();
        if (
          this.latePolicyService.isLateCountedAsAbsence(
            minutesLate,
            academicYear.lateCountAbscenseAfterMinutes,
          )
        )
          total++;
      }
    }
    return (total / expectedClasses) * 100;
  }

  async getExpectedClassesForSubject(
    subjectId: string,
    from: Date,
    to: Date,
    academicYearId: string,
  ): Promise<number> {
    const workingDays = await this.schedulePort.getWorkingDaysOnPeriod(
      from,
      to,
      academicYearId,
    );
    const slots = await this.schedulePort.findBySubject(subjectId);
    const classDaysOfWeek = new Set(slots.map((s) => s.dayOfWeek));
    const expectedClasses = workingDays.filter((d) =>
      classDaysOfWeek.has(this.getDayOfWeek(d)),
    );
    return expectedClasses.length;
  }

  private getDayOfWeek(date: Date): DAYOFWEEK {
    const days: Record<number, DAYOFWEEK> = {
      1: DAYOFWEEK.MONDAY,
      2: DAYOFWEEK.TUESDAY,
      3: DAYOFWEEK.WEDNESDAY,
      4: DAYOFWEEK.THURSDAY,
      5: DAYOFWEEK.FRIDAY,
    };
    return days[date.getDay()];
  }
}
```

---

### 4.5 `application/services/course-snapshot-builder.service.ts` (NUEVO)

**Responsabilidad:** Reemplaza `CourseSnapshotBuilderService`. Orquesta la búsqueda de datos y construye `CourseSnapshot`.

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ICoursePort } from '../../domain/ports/courses.port.interface';
import { IAttendanceRecordRepository } from '../../domain/repositories/attendance-record.repository.interface';
import { CourseSnapshot } from '../../domain/value-objects/course-snapshot.vo';
import { AttendanceRecord } from '../../domain/entities/attendance-record.entity';

@Injectable()
export class CourseSnapshotBuilder {
  constructor(
    private readonly coursePort: ICoursePort,
    private readonly attendanceRepo: IAttendanceRecordRepository,
  ) {}

  async buildCourseSnapshot(
    courseId: string,
    from: Date,
    to?: Date,
  ): Promise<CourseSnapshot> {
    const course = await this.coursePort.findById(courseId);
    if (!course) throw new NotFoundException('Course not found');

    const { justified, late, totalStudents, presents, absents } = to
      ? await this.attendanceRepo.getCourseSummaryForDateRange(courseId, from, to)
      : await this.attendanceRepo.getCourseSummaryForDate(courseId, from);

    return new CourseSnapshot(
      courseId,
      course.name,
      totalStudents,
      presents,
      absents,
      late,
      justified,
    );
  }

  buildWeeklyTrend(
    records: AttendanceRecord[],
  ): { mondayWeek: Date; percent: number }[] {
    const recordsByWeek = new Map<string, AttendanceRecord[]>();
    for (const record of records) {
      const date = new Date(record.date);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const mondayOfWeek = new Date(date.setDate(diff));
      const key = mondayOfWeek.toISOString();
      if (!recordsByWeek.has(key)) {
        recordsByWeek.set(key, [record]);
      }
      recordsByWeek.get(key)?.push(record);
    }

    const results: { mondayWeek: Date; percent: number }[] = [];
    for (const [monday, weekRecords] of recordsByWeek.entries()) {
      results.push({
        mondayWeek: new Date(monday),
        percent:
          (weekRecords.filter((r) => r.status === ATTENDANCE_STATUS.PRESENT).length /
            weekRecords.length) *
          100,
      });
    }
    return results;
  }
}
```

---

### 4.6 Query Handlers — Actualizar inyecciones

#### `get-course-daily-overview.handler.ts`

```diff
- import { CourseSnapshotBuilderService } from '../../../domain/services/dashboard.service';
+ import { CourseSnapshotBuilder } from '../../../services/course-snapshot-builder.service';

  @Injectable()
  export class GetCourseDailyOverviewQueryHandler {
    constructor(
      private readonly attendanceRepo: IAttendanceRecordRepository,
      private readonly coursePort: ICoursePort,
-     private readonly snapshotService: CourseSnapshotBuilderService,
+     private readonly snapshotBuilder: CourseSnapshotBuilder,
    ) {}

    async execute(query) {
      const course = await this.coursePort.findById(query.courseId);
      if (!course) throw new NotFoundException(...);

      const records = await this.attendanceRepo.findByCourseAndDate(
        query.courseId, query.date,
      );

-     const snapshot = await this.snapshotService.buildCourseSnapshot(
+     const snapshot = await this.snapshotBuilder.buildCourseSnapshot(
        query.courseId, query.date,
      );

      return {
        records,
        ...snapshot.toJSON(),
        statusColor: snapshot.getRiskStatus(...),
        lastUpdated: new Date(),
        level: course.level,
      };
    }
  }
```

#### `get-preceptor-dashboard.handler.ts`

```diff
- import { CourseSnapshotBuilderService } from '../../../domain/services/dashboard.service';
+ import { CourseSnapshotBuilder } from '../../../services/course-snapshot-builder.service';

  @Injectable()
  export class GetPreceptorDashboardQueryHandler {
    constructor(
      private readonly coursePort: ICoursePort,
-     private readonly dashService: CourseSnapshotBuilderService,
+     private readonly snapshotBuilder: CourseSnapshotBuilder,
    ) {}

    async execute(query) {
      const courses = await this.coursePort.findByPreceptorId(query.preceptorId);
      const snapshots: CourseSnapshotDto[] = [];
      for (const course of courses) {
-       const snapshot = await this.dashService.buildCourseSnapshot(
+       const snapshot = await this.snapshotBuilder.buildCourseSnapshot(
          course.id, query.date,
        );
        // ...rest unchanged
      }
    }
  }
```

#### `get-dashboard-metrics.handler.ts`

```diff
- import { CourseSnapshotBuilderService } from '../../../domain/services/dashboard.service';
+ import { CourseSnapshotBuilder } from '../../../services/course-snapshot-builder.service';

  @Injectable()
  export class GetDashboardMetricsQueryHandler {
    constructor(
      private readonly coursePort: ICoursePort,
      private readonly attendanceRepo: IAttendanceRecordRepository,
      private readonly academicYearPort: IAcademicYearPort,
-     private readonly dashService: CourseSnapshotBuilderService,
+     private readonly snapshotBuilder: CourseSnapshotBuilder,
    ) {}

    async execute(query) {
      // ...fetch year, courses, etc unchanged...

      for (const course of thisYearCourses) {
        const [courseSnapshots, courseRecords] = await Promise.all([
-         await this.dashService.buildCourseSnapshot(course.id, year.startDate, year.endDate),
+         await this.snapshotBuilder.buildCourseSnapshot(course.id, year.startDate, year.endDate),
          await this.attendanceRepo.findByCourseAndRange(course.id, year.startDate, year.endDate),
        ]);
        // ...rest unchanged
      }

      return new DashboardMetricsResponseDto({
        // ...
-       weeklyTrend: this.dashService.buildWeeklyTrend(records),
+       weeklyTrend: this.snapshotBuilder.buildWeeklyTrend(records),
        // ...
      });
    }
  }
```

---

### 4.7 `copy-attendance.handler.ts` — Repo directo

```diff
- import { AttendanceCopyService } from '../../../domain/services/attendance-copy.service';

  @Injectable()
  export class CopyAttendanceHandler {
    constructor(
      private readonly attendanceRepo: IAttendanceRecordRepository,
-     private readonly copyAttendanceService: AttendanceCopyService,
    ) {}

    async execute(command: CopyAttendanceCommand): Promise<void> {
-     const sourceRecords = await this.copyAttendanceService.getLastClassRecords(
-       command.subjectId,
-       command.sourceDate ?? command.targetDate,
-     );
+     const sourceRecords = await this.attendanceRepo.findRecordsOfLastSubjectClass(
+       command.subjectId,
+       command.sourceDate ?? command.targetDate,
+     );

      // ...rest unchanged
    }
  }
```

---

### 4.8 NestJS Module — Actualizar providers

```diff
// attendance.module.ts (o persistence module según estructura)
  providers: [
    // ...existing providers...
-   AttendanceCopyService,
-   CourseSnapshotBuilderService,
+   CourseSnapshotBuilder,
    AttendanceCalculationService,
-   ThresholdCheckerService,  // ya no es @Injectable
    // ...
  ]
```

---

## 5. Tests afectados

| Test | Cambio |
|---|---|
| `attendance-copy.service.spec.ts` | **Eliminar** — servicio eliminado |
| `copy-attendance.handler.spec.ts` | Quitar mock de `AttendanceCopyService`, verificar que llama `repo.findRecordsOfLastSubjectClass` directamente |
| `dashboard.service.spec.ts` | **Eliminar** — servicio eliminado |
| `get-course-daily-overview.handler.spec.ts` | Reemplazar mock de `CourseSnapshotBuilderService` por `CourseSnapshotBuilder` |
| `get-preceptor-dashboard.handler.spec.ts` | Reemplazar mock de `CourseSnapshotBuilderService` por `CourseSnapshotBuilder` |
| `get-dashboard-metrics.handler.spec.ts` | Reemplazar mock de `CourseSnapshotBuilderService` por `CourseSnapshotBuilder` |
| Tests nuevos (Sprint 08) | `threshold-checker.service.spec.ts` — test puro sin mocks |

---

## 6. Orden de ejecución

| # | Tarea | Dependencias | Archivos |
|---|---|---|---|
| 1 | Corregir `AlertType` VO | Ninguna | `alert-type.vo.ts` |
| 2 | Actualizar `AttendanceAlert` entity | #1 | `attendance-alert.entity.ts` |
| 3 | Purificar `ThresholdCheckerService` | #1 | `threshold-checker.service.ts` |
| 4 | Limpiar `AttendanceCalculationService` | Ninguna | `attendance-calculation.service.ts` |
| 5 | Crear `CourseSnapshotBuilder` | Ninguna | `course-snapshot-builder.service.ts` (nuevo) |
| 6 | Actualizar 3 query handlers | #5 | 3 archivos de handlers |
| 7 | Actualizar `CopyAttendanceHandler` | Ninguna | `copy-attendance.handler.ts` |
| 8 | Eliminar servicios obsoletos | #6, #7 | `attendance-copy.service.ts`, `course-snapshot-builder.service.ts` |
| 9 | Actualizar NestJS module | #6, #7, #8 | `attendance.module.ts` |
| 10 | Actualizar tests | Todos anteriores | Tests unitarios |
| 11 | Ejecutar lint y typecheck | Todos | — |

---

## 7. Criterios de verificación

- [ ] `npm run lint` pasa sin errores
- [ ] `npm run typecheck` (o `tsc --noEmit`) pasa sin errores
- [ ] Todos los tests existentes pasan
- [ ] Ningún servicio de dominio depende de `IAttendanceRecordRepository`
- [ ] `ThresholdCheckerService` es una clase con métodos estáticos, sin `@Injectable`
- [ ] `AttendanceCopyService` y `CourseSnapshotBuilderService` ya no existen
- [ ] `CourseSnapshotBuilder` está registrado en el módulo NestJS
- [ ] Los 3 query handlers usan `CourseSnapshotBuilder` en vez de `CourseSnapshotBuilderService`
- [ ] `CopyAttendanceHandler` llama al repo directamente
