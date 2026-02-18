# Sprint 10: Exportación

**Objetivo:** Exportación de reportes a Excel y PDF  
**Duración:** 1 semana  
**Estimación:** 25 horas  
**Depende de:** Sprint 09 (Reports)

---

## Objetivo

Implementar la exportación de reportes a Excel y PDF para generar documentos físicos.

---

## Estimación

| Área | Horas |
|------|-------|
| Domain Layer | 2 |
| Application Layer | 6 |
| Infrastructure Layer | 8 |
| Presentation Layer | 4 |
| Frontend | 5 |
| **Total** | **25** |

---

## Backend

### Domain Layer

**Módulo:** `modules/reporting`

**Archivos a crear/actualizar:**

```
modules/reporting/
├── domain/
│   └── services/
│       └── export.service.ts   # NUEVO - lógica de exportación
```

### Application Layer

**Módulo:** `modules/reporting/application`

**Archivos a crear:**

```
modules/reporting/
├── application/
│   ├── commands/
│   │   ├── export-excel/
│   │   │   ├── export-excel.command.ts
│   │   │   └── export-excel.handler.ts
│   │   └── export-pdf/
│   │       ├── export-pdf.command.ts
│   │       └── export-pdf.handler.ts
│   └── dtos/
│       ├── export-excel.dto.ts
│       └── export-pdf.dto.ts
│   └── reporting.module.ts   # Actualizar
```

### Infrastructure Layer

**Módulo:** `modules/reporting/infrastructure`

**Archivos a crear:**

```
modules/reporting/
├── infrastructure/
│   ├── services/
│   │   ├── excel-generator.service.ts   # NUEVO
│   │   └── pdf-generator.service.ts    # NUEVO
│   └── reporting.module.ts   # Actualizar
```

**Dependencias a instalar:**

```json
{
  "exceljs": "^4.x",
  "pdfkit": "^3.x",
  "puppeteer-core": "^21.x"  // Opcional para PDF más complejo
}
```

### Presentation Layer

**Módulo:** `modules/reporting/presentation`

**Archivos a crear/actualizar:**

```
modules/reporting/
└── presentation/
    ├── controllers/
    │   └── export.controller.ts   # NUEVO
    └── reporting.presentation.module.ts   # Actualizar
```

**Endpoints:**

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /reports/export/excel | Exportar a Excel |
| POST | /reports/export/pdf | Exportar a PDF |
| GET | /reports/export/template | Descargar template Excel |

---

## Frontend

### Pages

**Archivos a crear:**

```
src/app/
├── (dashboard)/
│   └── reports/
│       └── export/
│           ├── page.tsx           # /reports/export
│           └── components/
│               └── export-form.tsx
```

### Components

**Archivos a crear:**

```
src/components/
├── features/
│   └── reports/
│       └── export-form/
│           ├── export-form.tsx
│           ├── export-options.tsx
│           └── index.ts
```

### Hooks

**Archivos a crear/actualizar:**

```
packages/hooks/
├── src/
│   ├── reports/
│   │   ├── use-export-excel.ts
│   │   └── use-export-pdf.ts
│   └── index.ts   # Actualizar
```

---

## Testing

**Archivos a crear:**

```
apps/api/
├── test/
│   └── unit/
│       └── reporting/
│           ├── excel-generator.service.spec.ts
│           └── pdf-generator.service.spec.ts
```

---

## Tareas por Día

### Día 1: Application Layer

- [ ] Crear ExportExcelCommand
- [ ] Crear ExportPdfCommand
- [ ] Crear DTOs

### Día 2-3: Infrastructure Layer

- [ ] Instalar exceljs y pdfkit
- [ ] Crear ExcelGeneratorService
- [ ] Crear PdfGeneratorService

### Día 4: Presentation Layer

- [ ] Crear ExportController
- [ ] Configurar response como blob
- [ ] Probar con Postman

### Día 5-6: Frontend

- [ ] Crear página /reports/export
- [ ] Crear ExportForm
- [ ] Implementar download de blob

### Día 7: Integración

- [ ] Test de exportación Excel
- [ ] Test de exportación PDF

---

## Criterios de Aceptación

- [ ] Exportación a Excel funciona
- [ ] Exportación a PDF funciona
- [ ] Frontend puede descargar archivos
- [ ] Datos son correctos en los exports

---

## Siguiente Sprint

- Sprint 11: Comunicados y Polish
