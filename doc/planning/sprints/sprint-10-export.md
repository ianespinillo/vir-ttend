# Sprint 10 — Exportación a Excel y PDF

> **Objetivo:** Implementar la exportación de reportes mensuales e individuales a Excel y PDF para descarga y archivo físico.
> **Duración:** 1 semana · **Estimación:** 25 h · **Dependencias:** Sprint 09

---

## Resumen de horas

| Área | Horas |
|---|---|
| Domain Layer | 2 |
| Application Layer | 5 |
| Infrastructure Layer | 9 |
| Presentation Layer | 4 |
| Frontend (UI + hooks + páginas) | 5 |
| **Total** | **25** |

---

## Concepto clave: Exports como streaming

Los archivos generados se entregan directamente como streams en la response HTTP. No se guardan en disco ni en S3 en el MVP (deuda técnica documentada). El controller configura los headers correctos (`Content-Disposition`, `Content-Type`) y hace pipe del stream al response de Express.

---

## 1. Domain Layer — `modules/reporting/domain` (ampliar)

```
apps/api/src/modules/reporting/domain/
└── services/
    └── export-formatter.service.ts         # Lógica de formato puro (sin dependencias de librerías)
                                            # formatForExcel(report: MonthlyReportData): ExcelRow[]
                                            # formatForPdf(report: MonthlyReportData): PdfSection[]
                                            # → transforma el DTO en la estructura que espera el generador
```

### Tipos de dominio para export

```ts
// ExcelRow: { apellido, nombre, documento, presentes, ausentes, tardanzas, justificados, porcentaje, estado }
// PdfSection: { title, headers: string[], rows: string[][], summary: string[] }
```

---

## 2. Application Layer — `modules/reporting/application` (ampliar)

```
apps/api/src/modules/reporting/application/
├── commands/
│   ├── export-excel/
│   │   ├── export-excel.command.ts         # { courseId, month, year, type: 'monthly' | 'student', studentId? }
│   │   └── export-excel.handler.ts         # 1. obtiene el reporte (GetMonthlyReport o GenerateStudentReport)
│   │                                       # 2. llama ExportFormatterService.formatForExcel
│   │                                       # 3. llama IExcelGeneratorService.generate(rows)
│   │                                       # 4. retorna Buffer
│   └── export-pdf/
│       ├── export-pdf.command.ts           # misma firma que export-excel
│       └── export-pdf.handler.ts           # igual pero llama IPdfGeneratorService.generate(sections)
├── dtos/
│   ├── export-excel.request.dto.ts         # courseId, month, year, studentId?
│   └── export-pdf.request.dto.ts
└── reporting.module.ts                     # actualizar
```

### Interfaces de generadores (puertos del dominio)

```ts
// IExcelGeneratorService → generate(rows: ExcelRow[], title: string): Promise<Buffer>
// IPdfGeneratorService   → generate(sections: PdfSection[], metadata: PdfMetadata): Promise<Buffer>
// Se definen en domain, se implementan en infrastructure
```

---

## 3. Infrastructure Layer — `modules/reporting/infrastructure` (ampliar)

```
apps/api/src/modules/reporting/infrastructure/
└── services/
    ├── excel-generator.service.ts          # Implementa IExcelGeneratorService usando ExcelJS
    │                                       # Crea workbook con:
    │                                       #   - Hoja 1: datos de alumnos (columnas formateadas)
    │                                       #   - Fila de encabezado con fondo azul y texto blanco
    │                                       #   - Columna % con formato condicional (rojo si > umbral)
    │                                       #   - Fila de totales al final
    │                                       #   - Ajuste automático de ancho de columnas
    │                                       # Retorna Buffer via workbook.xlsx.writeBuffer()
    └── pdf-generator.service.ts            # Implementa IPdfGeneratorService usando PDFKit
                                            # Estructura del PDF:
                                            #   - Encabezado: logo placeholder, nombre school, período
                                            #   - Tabla de alumnos con bordes y colores alternados
                                            #   - Resumen al final: promedio, en riesgo, superados
                                            #   - Footer con fecha de generación y página N/M
                                            # Retorna Buffer via stream + concatenación de chunks
```

### Dependencias a instalar

```json
{
  "exceljs": "^4.x",
  "pdfkit": "^0.14.x"
}
```

### `excel-generator.service.ts` — detalles de implementación

```ts
// Columnas y anchos:
// Apellido (20), Nombre (18), Documento (12), Presentes (10),
// Ausentes (10), Tardanzas (10), Justificados (12), % (8), Estado (12)
//
// Formato condicional de la columna %:
// < 50% → verde (#C6EFCE)
// 50-74% → amarillo (#FFEB9C)
// ≥ 75% → rojo (#FFC7CE)
//
// Retornar como Buffer:
// const buffer = await workbook.xlsx.writeBuffer();
// return buffer as Buffer;
```

### `pdf-generator.service.ts` — detalles de implementación

```ts
// Usar PDFKit con stream: new PDFDocument({ size: 'A4', margin: 40 })
// Coletar chunks: doc.on('data', chunk => chunks.push(chunk))
// Retornar: doc.on('end', () => resolve(Buffer.concat(chunks)))
//
// Tabla de alumnos:
// - Calcular ancho de columnas según page width
// - Alternar fondo de filas (#FFFFFF / #F5F5F5)
// - Truncar texto largo con '...'
// - Salto de página automático al llenar la hoja
```

---

## 4. Presentation Layer — `modules/reporting/presentation` (ampliar)

```
apps/api/src/modules/reporting/presentation/
├── controllers/
│   └── export.controller.ts                # POST /reports/export/excel y /reports/export/pdf
│                                           # Configura headers de descarga y hace pipe del Buffer
└── reporting.presentation.module.ts       # actualizar
```

### Endpoints

| Método | Ruta | Roles | Descripción |
|---|---|---|---|
| `POST` | `/reports/export/excel` | `preceptor`, `admin` | Exportar reporte a Excel (.xlsx) |
| `POST` | `/reports/export/pdf` | `preceptor`, `admin` | Exportar reporte a PDF |

### Headers de respuesta correctos

```ts
// Excel:
// Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// Content-Disposition: attachment; filename="asistencia-3B-marzo-2025.xlsx"

// PDF:
// Content-Type: application/pdf
// Content-Disposition: attachment; filename="asistencia-3B-marzo-2025.pdf"
```

---

## 5. Frontend

### 5.1 `packages/ui` — componentes nuevos

```
packages/ui/src/components/features/reports/
└── export-actions/
    ├── index.ts
    ├── export-actions.tsx                  # Botones "Exportar Excel" y "Exportar PDF"
    │                                       # Con estado de carga y manejo de descarga automática
    │                                       # Props: courseId, month, year, isLoading, onExportExcel, onExportPdf
    └── export-progress.tsx                 # Indicador de progreso durante la generación
                                            # Props: isGenerating, format: 'excel' | 'pdf'
```

### 5.2 `packages/ui` — actualizar componentes existentes

```
packages/ui/src/components/features/reports/
└── monthly-report-table/
    └── monthly-report-table.tsx            # Agregar slot de acciones en el encabezado para ExportActions
                                            # Props: agregar onExportExcel, onExportPdf, isExporting?
```

### 5.3 `packages/hooks` — hooks nuevos

> **Patrón:** todos los hooks importan `apiClient` de `../lib/axios-client` (interno de `packages/hooks`) y las rutas de `@vir-ttend/common`. Ningún hook hardcodea URLs ni importa axios directamente.

```ts
// packages/hooks/src/reports/use-export-excel.ts
// useMutation → POST /reports/export/excel
// onSuccess: descarga automática via blob URL
//   const blob = new Blob([response], { type: 'application/vnd.openxmlformats...' })
//   const url = URL.createObjectURL(blob)
//   const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
//   URL.revokeObjectURL(url)

// packages/hooks/src/reports/use-export-pdf.ts
// igual pero con Content-Type: application/pdf
```

```
packages/hooks/src/
├── reports/
│   ├── use-export-excel.ts                 # useMutation con descarga automática de blob
│   └── use-export-pdf.ts                   # useMutation con descarga automática de blob
└── index.ts                               # actualizar
```

### 5.4 `apps/client` — actualizar páginas existentes

```
apps/client/src/app/(dashboard)/reports/monthly/page.tsx
# Agregar useExportExcel y useExportPdf
# Pasar handlers al MonthlyReportTable (ya tiene el slot de acciones)
```

---

## 6. Testing

```
apps/api/test/unit/reporting/
├── excel-generator.service.spec.ts         # verificar que el buffer generado es un XLSX válido
│                                           # verificar que tiene el número correcto de filas
├── pdf-generator.service.spec.ts           # verificar que el buffer es un PDF válido (empieza con %PDF)
└── export-excel.handler.spec.ts            # mock services, verificar que llama formatter y generator
```

---

## 7. Tareas por día

### Día 1: Domain + Application Layer
- [ ] Implementar `ExportFormatterService` con tipos `ExcelRow` y `PdfSection`
- [ ] `ExportExcelCommand` + handler
- [ ] `ExportPdfCommand` + handler
- [ ] DTOs de request

### Día 2–3: Infrastructure Layer
- [ ] Instalar `exceljs` y `pdfkit`
- [ ] Implementar `ExcelGeneratorService` con formato condicional
- [ ] Implementar `PdfGeneratorService` con tabla y footer

### Día 4: Presentation Layer
- [ ] `ExportController` con headers correctos de descarga
- [ ] Probar descarga con Postman (verificar archivo abre correctamente)

### Día 5: Frontend
- [ ] `ExportActions` en `packages/ui`
- [ ] Hooks con descarga via blob URL en `packages/hooks`
- [ ] Integrar en página de reportes en `apps/client`

### Día 6–7: Testing e integración
- [ ] Test de validez del Excel generado
- [ ] Test de validez del PDF generado
- [ ] Probar descarga en distintos navegadores
- [ ] Verificar nombre del archivo incluye curso y período

---

## 8. Criterios de aceptación

- [ ] Excel se descarga con formato correcto: encabezados, colores condicionales y fila de totales
- [ ] PDF se descarga con tabla, encabezado de school, período y footer con número de página
- [ ] Nombre del archivo incluye el nombre del curso y el período (ej: `asistencia-3B-marzo-2025.xlsx`)
- [ ] Botones de descarga muestran estado de carga durante la generación
- [ ] La descarga se inicia automáticamente sin abrir una nueva pestaña
- [ ] Excel abre correctamente en LibreOffice y Microsoft Excel
- [ ] PDF abre correctamente en el visor del navegador

---

**Siguiente sprint →** Sprint 11: Comunicados y Polish Final
