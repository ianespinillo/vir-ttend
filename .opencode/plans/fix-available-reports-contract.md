# Fix: contrato `AvailableReportsResponse` (`months` vs `periods`)

## Problema
El endpoint `GET /reports/course/:courseId/available` devuelve `{ courseId, months: [...] }`
(DTO backend: `available-reports.response.dto.ts:28`), pero el tipo frontend en
`@repo/common` declara `periods`, y la página lee `available?.periods ?? []` → siempre `[]`.

Consecuencia en cadena:
1. Selector de meses vacío/deshabilitado (`report-filters.tsx:62`)
2. Auto-selección del período nunca dispara (`page.tsx:101`)
3. `useMonthlyReport.enabled === false` → el reporte jamás se fetchea

## Cambios

### 1. `packages/common/src/types/reports/available-reports.response.type.ts`
Renombrar campo para alinear con el DTO:
```diff
 export interface AvailableReportsResponse {
 	courseId: string;
-	periods: AvailableReportPeriod[];
+	months: AvailableReportPeriod[];
 }
```

### 2. `apps/client/src/app/(dashboard)/reports/monthly/page.tsx` (línea 71)
```diff
-	const periods = available?.periods ?? [];
+	const periods = available?.months ?? [];
```

No hay otros consumidores del campo (verificado con grep global).

## Verificación
1. `pnpm ts:check` → 5/5 packages OK
2. `pnpm --filter @repo/common test && pnpm --filter @repo/ui test && pnpm --filter @repo/hooks test && pnpm --filter api test`
3. Manual: `/reports/monthly` → selector poblado con meses persistidos,
   auto-select del más reciente, reporte visible.

## Nota post-fix
Si el selector sigue vacío ya sin bug, la tabla `monthly_reports` está sin datos
(quedó truncada tras el fix de escala del promedio). Usar "Generar reporte"
(mes actual) o re-seedear.

## Commit propuesto
`fix(common): align available reports response field with api contract`
