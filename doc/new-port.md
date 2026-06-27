# Guía de Conexión entre Módulos
## NestJS + CQRS + DDD + Arquitectura Hexagonal

---

# Principios

## Regla de oro

Los módulos NO deberían conocerse directamente.

```
❌ Attendance -> StudentRepository

✔ Attendance -> StudentQueryService (Puerto)
                   ↑
             Adapter
                   ↑
               Students BC
```

Cada bounded context expone únicamente los contratos que otros necesitan.

---

# Estructura recomendada

```
src/
│
├── attendance/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   └── attendance.module.ts
│
├── students/
│   ├── application/
│   ├── domain/
│   ├── infrastructure/
│   ├── presentation/
│   └── students.module.ts
│
└── shared/
```

---

# Estructura interna

```
attendance/

application/
│
├── commands/
├── queries/
├── handlers/
├── dto/
├── services/
├── ports/
│   ├── inbound/
│   └── outbound/
│
└── use-cases/

domain/
│
├── entities/
├── events/
├── services/
├── repositories/
├── value-objects/
└── exceptions/

infrastructure/
│
├── persistence/
├── adapters/
├── event-handlers/
├── mappers/
└── config/

presentation/
│
├── controllers/
└── graphql/
```

---

# Cuándo usar cada cosa

## Repository

Solo para acceder al almacenamiento del MISMO bounded context.

```
AttendanceRepository

✔ Buscar asistencia
✔ Guardar asistencia

❌ Buscar alumnos
❌ Buscar cursos
```

---

## Query Service

Cuando otro módulo necesita información.

Ejemplo:

Attendance necesita saber si un alumno existe.

NO usa StudentRepository.

Usa:

```
StudentQueryService
```

Interface

```
export interface StudentQueryService {
    findByIds(ids: string[]): Promise<StudentDTO[]>;
}
```

---

## Adapter

Implementa el puerto.

```
Attendance
      │
      ▼
StudentQueryService
      │
      ▼
StudentQueryServiceAdapter
      │
      ▼
StudentRepository
```

El adapter vive del lado del proveedor.

```
students/

infrastructure/
    adapters/
        student-query-service.adapter.ts
```

---

# Dónde vive cada cosa

## Attendance necesita alumnos

### Attendance

```
application/

ports/
    outbound/
        student-query-service.ts
```

Solo la interface.

---

### Students

```
infrastructure/

adapters/
    student-query-service.adapter.ts
```

Implementación.

---

# Módulos

AttendanceModule

```ts
@Module({
    imports: [
        StudentsModule
    ]
})
```

StudentsModule

```ts
@Module({
    providers: [
        StudentRepository,
        StudentQueryServiceAdapter,
        {
            provide: StudentQueryService,
            useClass: StudentQueryServiceAdapter
        }
    ],
    exports: [
        StudentQueryService
    ]
})
```

Attendance puede inyectar únicamente el puerto.

Nunca el repository.

---

# Dependencias permitidas

```
Presentation
    ↓

Application
    ↓

Domain

Infrastructure
    ↑
```

Infrastructure implementa interfaces de Application o Domain.

Nunca al revés.

---

# CQRS

## Command

Modifica estado.

```
CreateAttendanceCommand

↓

Handler

↓

Repository
```

Nunca devuelve información compleja.

---

## Query

Solo lectura.

```
GetAttendanceQuery

↓

Handler

↓

ReadModel
```

No modifica nada.

---

# Comunicación entre bounded contexts

Siempre mediante puertos.

```
Attendance
      │
      ▼
Attendance Port

      │

Adapter

      │

Students
```

Nunca

```
AttendanceRepository

↓

StudentRepository
```

---

# Eventos

Cuando otro módulo debe reaccionar.

Ejemplo

```
AttendanceCreatedEvent
```

```
Attendance

↓

EventEmitter

↓

Grades
Notifications
Statistics
```

No usar eventos para pedir información.

Los eventos notifican.

No responden.

---

# Cuándo usar Adapter

Siempre que un bounded context necesite otro.

Ejemplos

Attendance → Students

Grades → Attendance

Payments → Users

Notifications → Users

Nunca acceder directamente al repository del otro módulo.

---

# Domain Service

Contiene reglas de negocio puras.

No usa:

- Prisma
- TypeORM
- Http
- Redis
- Nest

Ejemplo

```
AttendanceCalculator
```

---

# Application Service

Coordina casos de uso.

Puede usar

- Repositories
- Query Services
- EventBus
- CommandBus

No contiene lógica de negocio compleja.

---

# Infrastructure

Aquí viven

- Prisma
- TypeORM
- Redis
- RabbitMQ
- HTTP
- Cloudinary
- Email
- Adapters
- Repositories

Todo lo externo.

---

# Presentation

Solo

- Controllers
- GraphQL
- Guards
- Pipes
- DTO de entrada

Nunca lógica de negocio.

---

# Flujo típico

```
Controller

↓

Command

↓

CommandHandler

↓

Domain Service

↓

Repository

↓

Event
```

---

# Flujo entre módulos

Attendance necesita alumnos

```
Controller

↓

CreateAttendanceCommand

↓

Handler

↓

StudentQueryService

↓

StudentQueryServiceAdapter

↓

StudentRepository

↓

Student
```

---

# Ejemplo real

Attendance quiere justificar asistencia.

Necesita verificar que el alumno exista.

```
AttendanceHandler

↓

StudentQueryService.findById()

↓

StudentAdapter

↓

StudentRepository

↓

Prisma
```

Nunca

```
AttendanceHandler

↓

StudentRepository
```

---

# Checklist

Antes de conectar dos módulos preguntarse:

□ ¿Solo necesito leer información?
→ Query Service

□ ¿Necesito modificar el otro módulo?
→ Command

□ ¿Solo quiero avisar algo?
→ Event

□ ¿Estoy accediendo al repository de otro módulo?
→ Está mal.

□ ¿Estoy importando entidades del otro módulo?
→ Generalmente está mal.

□ ¿Estoy usando interfaces?
→ Bien.

□ ¿El adapter vive del lado del proveedor?
→ Sí.

□ ¿El repository solo accede a su agregado?
→ Sí.

□ ¿El dominio depende de Nest?
→ No.

□ ¿Application conoce Infrastructure?
→ No.

□ ¿Infrastructure implementa interfaces?
→ Sí.

---

# Regla práctica

Para comunicar dos bounded contexts:

1. Definir un puerto (interface) en el consumidor.
2. Implementarlo mediante un adapter en el proveedor.
3. Exportar el puerto desde el módulo proveedor.
4. Inyectar únicamente el puerto.
5. Nunca acceder directamente al repository del otro contexto.