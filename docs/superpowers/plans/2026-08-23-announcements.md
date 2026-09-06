# Sprint 09 — Comunicados · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar comunicados end-to-end: listado general (admin/preceptor), creación con targeting (todos/rol-curso/nivel) con drafts y publicación programada, detalle híbrido y "Para mí" con fan-out client-side y read-state local.

**Architecture:** El contrato real del backend manda (`targetType/targetId`, NO `targetRole/targetCourseId` del doc original). Tipos/form-schema en `@repo/common`; hooks de datos ya existen (list/for-me/detail/create/update/publish/delete) — se agregan helpers puros + 2 hooks contenedores (relevant-announcements con fan-out `useQueries`, read-state en localStorage). UI presentacional con data por props (patrón AlertsList), páginas client thin-controller (patrón students/page). El detalle es híbrido: admin/preceptor usan `GET /announcements/:id`; otros roles renderizan desde el item cacheado de for-me (el body viene completo en el listado).

**Tech Stack:** Next.js App Router (client pages), TanStack Query v5 (`useQuery/useMutation/useQueries`), react-hook-form + zod (schema en common), shadcn/ui primitives, date-fns + locale es, Vitest (+RTL en ui), Jest (api, sin cambios aquí), Biome (tabs, LF, width 80), pnpm workspaces + turbo.

**Spec:** diseño aprobado en sesión (ver conversación) basado en `doc/planning/frontend/sprints/sprint-09-announcements.md` + contrato real verificado contra `apps/api/src/modules/identity/**` (announcements.controller.ts, DTOs, value-object).

## Global Constraints

- Biome: tabs, single quotes, line width 80, **LF endings** (los archivos nuevos deben guardarse LF; correr `pnpm exec biome check --write <file>` si hace falta).
- Mensajes de validación y copy de UI **en español**.
- Convencional commits ≤72 chars; husky pre-commit corre turbo `ts:check` (5 pkgs) + `lint:check` + tests: **rebuildear dists** de `@repo/common`/`@repo/hooks`/`@repo/ui` después de cambiar sus fuentes antes de confiar en `ts:check` del client (`pnpm --filter @repo/common --filter @repo/hooks --filter @repo/ui run build`).
- `@repo/ui` NO importa `next/*` (navegación por callbacks `onOpen/onPageChange` que las páginas cablean con `router`). Los componentes usan `'use client'` cuando tienen interactividad.
- Barrel style: features `index.ts` con `export { X } from './x'` + `export type { XProps }`; schemas barrel usa extensión `.js`.
- Roles: `GET/POST/PUT/PATCH /announcements*` = ADMIN+PRECEPTOR (superadmin incluido recibe 403); `DELETE` = ADMIN; `/for-me` = todos. El nivel como `targetId` va en **lowercase**: `'primary' | 'secondary'` (el VO del backend rechaza otra cosa).
- `LEVEL` enum de common es UPPERCASE (`PRIMARY`,`SECONDARY`,`DEFAULT`): se usa SOLO para comparaciones con cursos; el targeting de nivel se maneja con literales lowercase.
- Working tree del usuario tiene WIP sin commitear (~82 archivos attendance): **NUNCA** `git add .` / `git add -A`; siempre agregar archivos explícitos.

---

### Task 1: Contrato en `@repo/common` — tipos corregidos, ruta nueva, form-schema Zod + tests

**Files:**
- Modify: `packages/common/src/types/announcements/announcement.response.type.ts`
- Modify: `packages/common/src/routes/app.routes.ts`
- Create: `packages/common/src/schemas/announcement.schema.ts`
- Modify: `packages/common/src/schemas/index.ts`
- Test: `packages/common/src/schemas/announcement.schema.test.ts`

**Interfaces:**
- Produces: `Announcement` con fechas ISO `string`; `APP_ROUTES.meAnnouncements`; `createAnnouncementSchema`, `CreateAnnouncementFormValues`, `LevelTargetOption`, `serializePublishAt(local: string | null | undefined): string | null`.

- [ ] **Step 1: Corregir fechas del tipo `Announcement`** — en `announcement.response.type.ts` cambiar `publishAt: Date | null` → `publishAt: string | null` y `createdAt: Date` → `createdAt: string` (JSON transport = ISO strings; date-fns acepta string).

- [ ] **Step 2: Agregar ruta de app** — en `app.routes.ts` agregar `meAnnouncements: '/me/announcements',` después de `announcements`.

- [ ] **Step 3: Write the failing test**

```ts
// packages/common/src/schemas/announcement.schema.test.ts
import { describe, expect, it } from 'vitest';
import {
	createAnnouncementSchema,
	serializePublishAt,
} from './announcement.schema.js';

describe('createAnnouncementSchema', () => {
	const base = { title: 'Reunión', body: 'Contenido' };

	it('acepta targeting school sin targetId', () => {
		const res = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'school',
		});
		expect(res.success).toBe(true);
	});

	it('exige uuid cuando targetType es course', () => {
		const bad = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'course',
			targetId: '',
		});
		expect(bad.success).toBe(false);

		const ok = createAnnouncementSchema.safeParse({
			...base,
			targetType: 'course',
			targetId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
		});
		expect(ok.success).toBe(true);
	});

	it('solo acepta primary|secondary cuando targetType es level', () => {
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'level',
				targetId: 'primary',
			}).success,
		).toBe(true);
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'level',
				targetId: 'PRIMARY',
			}).success,
		).toBe(false);
	});

	it('rechaza título vacío', () => {
		expect(
			createAnnouncementSchema.safeParse({
				title: '',
				body: 'x',
				targetType: 'school',
			}).success,
		).toBe(false);
	});

	it('valida publishAt en formato datetime-local si viene', () => {
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'school',
				publishAt: '2026-09-01T10:30',
			}).success,
		).toBe(true);
		expect(
			createAnnouncementSchema.safeParse({
				...base,
				targetType: 'school',
				publishAt: 'no-es-fecha',
			}).success,
		).toBe(false);
	});
});

describe('serializePublishAt', () => {
	it('convierte datetime-local a ISO o null', () => {
		expect(serializePublishAt('2026-09-01T10:30')).toBe(
			new Date('2026-09-01T10:30').toISOString(),
		);
		expect(serializePublishAt(null)).toBeNull();
		expect(serializePublishAt(undefined)).toBeUndefined();
	});
});
```

- [ ] **Step 4: Run test to verify it fails** — `pnpm --filter @repo/common exec vitest run src/schemas/announcement.schema.test.ts` → FAIL (módulo no existe).

- [ ] **Step 5: Implementar schema**

```ts
// packages/common/src/schemas/announcement.schema.ts
import { z } from 'zod';

export const announcementTargetTypes = [
	'school',
	'course',
	'level',
] as const;

export const levelTargets = ['primary', 'secondary'] as const;

export const LevelTargetOption: Record<(typeof levelTargets)[number], string> =
	{
		primary: 'Primaria',
		secondary: 'Secundaria',
	};

export const createAnnouncementSchema = z
	.object({
		title: z
			.string()
			.trim()
			.min(3, 'El título debe tener al menos 3 caracteres')
			.max(120, 'El título no puede superar 120 caracteres'),
		body: z.string().trim().min(1, 'El contenido es obligatorio'),
		targetType: z.enum(announcementTargetTypes),
		targetId: z.string().optional(),
		publishAt: z
			.string()
			.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, {
				message: 'Fecha inválida',
			})
			.nullish(),
	})
	.superRefine((val, ctx) => {
		if (val.targetType === 'course') {
			if (!val.targetId) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['targetId'],
					message: 'Debe seleccionar un curso',
				});
			} else if (
				!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
					val.targetId,
				)
			) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ['targetId'],
					message: 'Debe seleccionar un curso válido',
				});
			}
		}
		if (
			val.targetType === 'level' &&
			!(levelTargets as readonly string[]).includes(val.targetId ?? '')
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ['targetId'],
				message: 'Debe seleccionar un nivel',
			});
		}
	});

export type CreateAnnouncementFormValues = z.infer<
	typeof createAnnouncementSchema
>;

/** Convierte un input datetime-local al ISO que espera el backend. */
export function serializePublishAt(
	local: string | null | undefined,
): string | null | undefined {
	if (local === null) return null;
	if (!local) return undefined;
	return new Date(local).toISOString();
}
```

- [ ] **Step 6:** En `schemas/index.ts` agregar `export * from './announcement.schema.js';` (orden alfabético tras auth).

- [ ] **Step 7: Run test to verify it passes** — mismo comando → PASS (8 tests).

- [ ] **Step 8: Rebuild dist + Commit**

```bash
pnpm --filter @repo/common run build
git add packages/common/src/types/announcements/announcement.response.type.ts packages/common/src/routes/app.routes.ts packages/common/src/schemas/announcement.schema.ts packages/common/src/schemas/announcement.schema.test.ts packages/common/src/schemas/index.ts
git commit -m "feat(common): announcement contract, route and form schema"
```

---

### Task 2: Read-state local — helpers puros + hook

**Files:**
- Create: `packages/hooks/src/features/announcements/read-state.ts`
- Create: `packages/hooks/src/features/announcements/use-read-announcements.ts`
- Modify: `packages/hooks/src/index.ts` (agregar export de ambos, sección announcements)
- Test: `packages/hooks/src/features/announcements/read-state.test.ts`

**Interfaces:**
- Produces: `loadReadIds(userId, storage?): Set<string>`, `persistReadId(userId, id, storage): void`, `useReadAnnouncements(userId?: string): { readIds: Set<string>; markRead(id: string): void }`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/hooks/src/features/announcements/read-state.test.ts
import { describe, expect, it } from 'vitest';
import { loadReadIds, persistReadId } from './read-state';

const fakeStorage = (initial: Record<string, string> = {}) => {
	const map = { ...initial };
	return {
		getItem: (k: string) => map[k] ?? null,
		setItem: (k: string, v: string) => {
			map[k] = v;
		},
	};
};

describe('read-state', () => {
	it('devuelve set vacío si no hay nada guardado o userId vacío', () => {
		const storage = fakeStorage();
		expect(loadReadIds('', storage).size).toBe(0);
		expect(loadReadIds('u1', storage).size).toBe(0);
	});

	it('lee ids persistidos por usuario', () => {
		const storage = fakeStorage({
			'vt.annc.read.u1': JSON.stringify(['a', 'b']),
		});
		expect(loadReadIds('u1', storage)).toEqual(new Set(['a', 'b']));
	});

	it('tolera JSON corrupto', () => {
		const storage = fakeStorage({ 'vt.annc.read.u1': '{oops' });
		expect(loadReadIds('u1', storage).size).toBe(0);
	});

	it('persistReadId agrega sin duplicados', () => {
		const storage = fakeStorage({
			'vt.annc.read.u1': JSON.stringify(['a']),
		});
		persistReadId('u1', 'a', storage);
		persistReadId('u1', 'b', storage);
		expect(loadReadIds('u1', storage)).toEqual(new Set(['a', 'b']));
	});
});
```

- [ ] **Step 2: Run to verify FAIL** — `pnpm --filter @repo/hooks exec vitest run src/features/announcements/read-state.test.ts` → FAIL.

- [ ] **Step 3: Implementar**

```ts
// packages/hooks/src/features/announcements/read-state.ts
export interface MinimalStorage {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
}

const storageKey = (userId: string) => `vt.annc.read.${userId}`;

export function loadReadIds(
	userId: string,
	storage: MinimalStorage = window.localStorage,
): Set<string> {
	if (!userId) return new Set();
	try {
		const raw = storage.getItem(storageKey(userId));
		const parsed = raw ? (JSON.parse(raw) as unknown) : [];
		return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
	} catch {
		return new Set();
	}
}

export function persistReadId(
	userId: string,
	id: string,
	storage: MinimalStorage = window.localStorage,
): void {
	if (!userId || !id) return;
	const ids = loadReadIds(userId, storage);
	ids.add(id);
	storage.setItem(storageKey(userId), JSON.stringify([...ids]));
}
```

```ts
// packages/hooks/src/features/announcements/use-read-announcements.ts
'use client';

import { useCallback, useMemo } from 'react';
import {
	loadReadIds,
	persistReadId,
} from './read-state';
import { useState } from 'react';

export function useReadAnnouncements(userId?: string) {
	const [version, setVersion] = useState(0);

	const readIds = useMemo(() => {
		void version;
		return loadReadIds(userId ?? '');
	}, [userId, version]);

	const markRead = useCallback(
		(id: string) => {
			if (!userId) return;
			persistReadId(userId, id);
			setVersion((v) => v + 1);
		},
		[userId],
	);

	return { readIds, markRead };
}
```

- [ ] **Step 4: Run PASS** + barrel: en `packages/hooks/src/index.ts` sección announcements agregar `export * from './features/announcements/read-state';` y `export * from './features/announcements/use-read-announcements';`

- [ ] **Step 5: Commit**

```bash
git add packages/hooks/src/features/announcements/read-state.ts packages/hooks/src/features/announcements/read-state.test.ts packages/hooks/src/features/announcements/use-read-announcements.ts packages/hooks/src/index.ts
git commit -m "feat(hooks): local read-state for announcements"
```

---

### Task 3: Fan-out "Para mí" — helpers puros + hook contenedor + tests

**Files:**
- Create: `packages/hooks/src/features/announcements/relevant-announcements.ts`
- Create: `packages/hooks/src/features/announcements/use-relevant-announcements.ts`
- Modify: `packages/hooks/src/index.ts` (exports)
- Test: `packages/hooks/src/features/announcements/relevant-announcements.test.ts`

**Interfaces:**
- Consumes: `useMyCourses({academicYearId, isPreceptor})` → `ICourseResponse[]` (`id`, `level: LevelType`, `fullName`), `useTeacherSubjects({teacherId, academicYearId})` → `ISubjectResponse[]` (`courseId?`), `ANNOUNCEMENT_ROUTES.forMe`, `queryKeys.announcements.forMe`, `ROLES`.
- Produces: `dedupeById(lists: Announcement[][]): Announcement[]` (sort createdAt desc), `resolveContexts(role, courses, subjectCourseIds): { courseIds: string[]; levels: string[] }` (levels lowercase únicos), `useRelevantAnnouncements({role?, userId?, academicYearId?}): { announcements: Announcement[]; isLoading: boolean; contexts: ReturnType<resolveContexts> }`.

- [ ] **Step 1: Write the failing test**

```ts
// packages/hooks/src/features/announcements/relevant-announcements.test.ts
import { ROLES } from '@repo/common';
import { describe, expect, it } from 'vitest';
import type { Announcement } from '@repo/common';
import { dedupeById, resolveContexts } from './relevant-announcements';

const annc = (
	id: string,
	createdAt: string,
): Announcement => ({
	id,
	title: id,
	body: '',
	targetType: 'school',
	targetId: '',
	status: 'published',
	publishAt: null,
	authorName: '',
	createdAt,
});

describe('dedupeById', () => {
	it('une listas, elimina duplicados y ordena desc por createdAt', () => {
		const merged = dedupeById([
			[annc('a', '2026-08-01T10:00:00Z'), annc('b', '2026-08-03T10:00:00Z')],
			[annc('a', '2026-08-01T10:00:00Z'), annc('c', '2026-08-02T10:00:00Z')],
		]);
		expect(merged.map((a) => a.id)).toEqual(['b', 'c', 'a']);
	});
});

describe('resolveContexts', () => {
	it('preceptor deriva courseIds y levels lowercase desde sus cursos', () => {
		const courses = [
			{ id: 'c1', level: 'PRIMARY' },
			{ id: 'c2', level: 'SECONDARY' },
		];
		expect(resolveContexts(ROLES.PRECEPTOR, courses, [])).toEqual({
			courseIds: ['c1', 'c2'],
			levels: ['primary', 'secondary'],
		});
	});

	it('teacher usa los courseIds de sus materias (sin niveles)', () => {
		expect(resolveContexts(ROLES.TEACHER, [], ['s1', 's1', 's2'])).toEqual({
			courseIds: ['s1', 's2'],
			levels: [],
		});
	});

	it('admin/superadmin no tienen contexto personal', () => {
		expect(resolveContexts(ROLES.ADMIN, [], [])).toEqual({
			courseIds: [],
			levels: [],
		});
	});
});
```

- [ ] **Step 2: Run FAIL** — `pnpm --filter @repo/hooks exec vitest run src/features/announcements/relevant-announcements.test.ts`.

- [ ] **Step 3: Implementar helpers**

```ts
// packages/hooks/src/features/announcements/relevant-announcements.ts
import type { Announcement, ICourseResponse, Roles } from '@repo/common';

export interface RelevantContexts {
	courseIds: string[];
	levels: string[];
}

export function dedupeById(lists: Announcement[][]): Announcement[] {
	const byId = new Map<string, Announcement>();
	for (const list of lists) {
		for (const item of list) byId.set(item.id, item);
	}
	return [...byId.values()].sort(
		(a, b) =>
			new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export function resolveContexts(
	role: Roles,
	courses: Pick<ICourseResponse, 'id' | 'level'>[],
	subjectCourseIds: string[],
): RelevantContexts {
	if (role === ROLES.PRECEPTOR) {
		const seenLevels = new Set<string>();
		const levels: string[] = [];
		for (const c of courses) {
			const key = c.level.toLowerCase();
			if (!seenLevels.has(key)) {
				seenLevels.add(key);
				levels.push(key);
			}
		}
		return { courseIds: courses.map((c) => c.id), levels };
	}
	if (role === ROLES.TEACHER) {
		return { courseIds: [...new Set(subjectCourseIds)], levels: [] };
	}
	return { courseIds: [], levels: [] };
}
```

- [ ] **Step 4: Implementar hook contenedor**

```ts
// packages/hooks/src/features/announcements/use-relevant-announcements.ts
'use client';

import {
	type Announcement,
	ANNOUNCEMENT_ROUTES,
	type ApiResponse,
	ROLES,
	type Roles,
} from '@repo/common';
import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { apiClient } from '../../lib/axios-client';
import { queryKeys } from '../../lib/keys';
import { useMyCourses } from '../courses/use-my-courses';
import { useTeacherSubjects } from '../attendance/use-teacher-subjects';
import { dedupeById, resolveContexts, type RelevantContexts } from './relevant-announcements';

export interface UseRelevantAnnouncementsParams {
	role?: Roles;
	userId?: string;
	academicYearId?: string;
}

type ForMeParams =
	| { courseId: string }
	| { level: string }
	| Record<string, never>;

async function fetchForMe(params: ForMeParams): Promise<Announcement[]> {
	const res = await apiClient.get<ApiResponse<Announcement[]>>(
		ANNOUNCEMENT_ROUTES.forMe,
		{ params },
	);
	return res.data.data ?? [];
}

export function useRelevantAnnouncements({
	role,
	userId,
	academicYearId,
}: UseRelevantAnnouncementsParams = {}) {
	const isPreceptor = role === ROLES.PRECEPTOR;
	const isTeacher = role === ROLES.TEACHER;

	const myCourses = useMyCourses({
		academicYearId,
		isPreceptor,
	});
	const teacherSubjects = useTeacherSubjects({
		teacherId: userId,
		academicYearId,
	});

	const contexts: RelevantContexts = useMemo(() => {
		const courses = isPreceptor ? (myCourses.data ?? []) : [];
		const subjectCourseIds = isTeacher
			? (teacherSubjects.data ?? [])
					.map((s) => s.courseId)
					.filter((id): id is string => Boolean(id))
			: [];
		if (!role) return { courseIds: [], levels: [] };
		return resolveContexts(role, courses, subjectCourseIds);
	}, [role, isPreceptor, isTeacher, myCourses.data, teacherSubjects.data]);

	const paramSets: ForMeParams[] = useMemo(() => {
		const sets: ForMeParams[] = [{}];
		for (const courseId of contexts.courseIds) sets.push({ courseId });
		for (const level of contexts.levels) sets.push({ level });
		return sets;
	}, [contexts]);

	const results = useQueries({
		queries: paramSets.map((params) => ({
			queryKey: [...queryKeys.announcements.forMe, params],
			queryFn: () => fetchForMe(params),
			staleTime: 1000 * 60 * 2,
			enabled: Boolean(role),
		})),
	});

	const announcements = useMemo(
		() => dedupeById(results.map((r) => r.data ?? [])),
		[results],
	);

	const isLoading =
		results.some((r) => r.isLoading) ||
		(isPreceptor && myCourses.isLoading) ||
		(isTeacher && teacherSubjects.isLoading);

	return { announcements, isLoading, contexts };
}
```

Nota: `useMyCourses` con `isPreceptor:false` para teacher NO se usa (traería todos los cursos); teacher solo usa subjects. Admin/superadmin: `contexts` vacío → única llamada school.

- [ ] **Step 5: Run PASS** (helpers) + `pnpm --filter @repo/hooks run build` + exports en barrel (`./features/announcements/relevant-announcements`, `./features/announcements/use-relevant-announcements`).

- [ ] **Step 6: Commit**

```bash
git add packages/hooks/src/features/announcements/ packages/hooks/src/index.ts
git commit -m "feat(hooks): relevant announcements fan-out for for-me view"
```

---

### Task 4: Primitivas base — `Textarea` + `formatDateTime/formatRelative`

**Files:**
- Create: `packages/ui/src/ui/textarea.tsx`
- Modify: `packages/ui/src/lib/format.ts` (agregar 2 helpers; eliminar `console.log` línea 23)
- Modify: `packages/ui/src/index.tsx` (export textarea)

**Interfaces:**
- Produces: `Textarea` (shadcn estándar), `formatDateTime(d: Date|string): string` (`dd/MM/yyyy HH:mm`), `formatRelative(d: Date|string): string` (`formatDistanceToNowStrict` + sufijo "hace").

- [ ] **Step 1: Crear `ui/textarea.tsx`** (patrón shadcn idéntico al resto de primitivas del paquete):

```tsx
import * as React from 'react';
import { cn } from '../lib/utils';

function Textarea({
	className,
	...props
}: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
```

- [ ] **Step 2: format.ts** — quitar `console.log('formatMonthLabel', month, style);`; agregar:

```ts
import { format, formatDistanceToNowStrict } from 'date-fns';

export function formatDateTime(date: Date | string): string {
	return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatRelative(date: Date | string): string {
	return `hace ${formatDistanceToNowStrict(new Date(date), { locale: es })}`;
}
```

- [ ] **Step 3: Exportar** en `packages/ui/src/index.tsx`: `export * from './ui/textarea';` (junto a las otras primitivas). Verificar `format.test.ts` sigue pasando (console.log eliminado puede romper snapshot de stdout si existiera — no existe).

- [ ] **Step 4: Verificar** `pnpm --filter @repo/ui exec vitest run src/lib/format.test.ts` → PASS. Commit:

```bash
git add packages/ui/src/ui/textarea.tsx packages/ui/src/lib/format.ts packages/ui/src/index.tsx
git commit -m "feat(ui): textarea primitive and datetime formatters"
```

---

### Task 5: Componentes presentacionales + tests (card, badges, listas)

**Files:**
- Create: `packages/ui/src/components/features/announcements/target-badge.tsx`
- Create: `packages/ui/src/components/features/announcements/announcement-card.tsx`
- Create: `packages/ui/src/components/features/announcements/announcements-list.tsx`
- Create: `packages/ui/src/components/features/announcements/for-me-list.tsx`
- Create: `packages/ui/src/components/features/announcements/index.ts`
- Modify: `packages/ui/src/index.tsx` (`export * from './components/features/announcements';`)
- Test: `packages/ui/src/components/features/announcements/target-badge.test.tsx`, `announcement-card.test.tsx`, `announcements-list.test.tsx`

**Interfaces:**
- Consumes: `Announcement`, `AnnouncementsListResponse` de `@repo/common`; `EmptyState`, `Button`, `Skeleton`, `Badge` existentes; `formatRelative` (Task 4).
- Produces:
  - `TargetBadge({targetType, targetLabel?}: {targetType: 'school'|'course'|'level'; targetLabel?: string})` — school→"Toda la escuela", level/course→`targetLabel ?? 'Dirigido'`.
  - `AnnouncementCard({announcement, isUnread?, statusVisible?, targetLabel?, onOpen}: {announcement: Announcement; isUnread?: boolean; statusVisible?: boolean; targetLabel?: string; onOpen?: (a: Announcement) => void})` — fila clickeable: dot azul si unread, título semibold, snippet body 2 líneas truncate, autor · fecha relativa, badges target (+estado draft/published si statusVisible).
  - `AnnouncementsListProps {data: AnnouncementsListResponse | null; isLoading?; readIds?: Set<string>; courseNames?: Record<string,string>; statusVisible?: boolean; onOpen?; onPageChange?}` — tri-state skeleton/empty/paginación clonando estructura de `alerts-list.tsx` (border rounded-lg, filas divididas, footer "Página X de Y").
  - `ForMeListProps {announcements?: Announcement[]; isLoading?; readIds?: Set<string>; courseNames?: Record<string,string>; onOpen?}` — igual sin paginación (array plano).

- [ ] **Step 1: Write failing tests** (RTL, patrón de `report-status-badge.test.tsx`):

`target-badge.test.tsx`: (1) school renderiza "Toda la escuela"; (2) course con label renderiza el label; (3) course sin label renderiza "Dirigido".

`announcement-card.test.tsx`: fixture `announcement` (status published, targetType course); (1) muestra título, autor y fecha relativa; (2) `isUnread` renderiza el dot (`data-testid="unread-dot"`); sin unread no existe; (3) click llama `onOpen(announcement)`; (4) `statusVisible` + draft muestra badge "Borrador".

`announcements-list.test.tsx`: (1) `isLoading` → renderiza 5 skeleton rows (`data-testid="skeleton-row"`); (2) data null → EmptyState "Sin comunicados"; (3) con totalPages 2 y page 1 → botón "Anterior" disabled, "Siguiente" habilitado; (4) unread dot aparece según readIds.

Fixture compartido dentro de cada test file (sin helpers cruzados entre tests de tasks distintas).

- [ ] **Step 2: Run FAIL** — `pnpm --filter @repo/ui exec vitest run src/components/features/announcements` → FAIL.

- [ ] **Step 3: Implementar componentes** (estructura clave; estilos siguiendo alert-item/alerts-list):

```tsx
// target-badge.tsx
'use client';
import { Badge } from '../../../ui/badge';
import type { AnnouncementTargetType } from '@repo/common';

export interface TargetBadgeProps {
	targetType: AnnouncementTargetType;
	targetLabel?: string;
}

const TARGET_LABELS: Record<AnnouncementTargetType, string> = {
	school: 'Toda la escuela',
	level: 'Dirigido',
	course: 'Dirigido',
};

export function TargetBadge({ targetType, targetLabel }: Readonly<TargetBadgeProps>) {
	return (
		<Badge variant="outline" className="gap-1 font-normal">
			{targetLabel ?? TARGET_LABELS[targetType]}
		</Badge>
	);
}
```

```tsx
// announcement-card.tsx (núcleo)
'use client';
import type { Announcement } from '@repo/common';
import { Megaphone } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { formatRelative } from '../../../lib/format';
import { TargetBadge } from './target-badge';

export interface AnnouncementCardProps {
	announcement: Announcement;
	isUnread?: boolean;
	statusVisible?: boolean;
	targetLabel?: string;
	onOpen?: (announcement: Announcement) => void;
}

export function AnnouncementCard({
	announcement,
	isUnread,
	statusVisible,
	targetLabel,
	onOpen,
}: Readonly<AnnouncementCardProps>) {
	return (
		<button
			type="button"
			onClick={() => onOpen?.(announcement)}
			className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/50 border-b border-border/50 last:border-b-0"
		>
			<span className="mt-0.5 shrink-0">
				<Megaphone className="h-5 w-5 text-muted-foreground" />
			</span>
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					{isUnread && (
						<span
							data-testid="unread-dot"
							className="h-2 w-2 rounded-full bg-blue-500 shrink-0"
						/>
					)}
					<p className="truncate font-medium">{announcement.title}</p>
				</div>
				<p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
					{announcement.body}
				</p>
				<div className="mt-2 flex flex-wrap items-center gap-2">
					<TargetBadge
						targetType={announcement.targetType}
						targetLabel={targetLabel}
					/>
					{statusVisible && (
						<Badge variant={announcement.status === 'draft' ? 'secondary' : 'default'}>
							{announcement.status === 'draft' ? 'Borrador' : 'Publicado'}
						</Badge>
					)}
					<span className="text-xs text-muted-foreground">
						{announcement.authorName} · {formatRelative(announcement.createdAt)}
					</span>
				</div>
			</div>
		</button>
	);
}
```

```tsx
// announcements-list.tsx — clonar tri-state de alerts-list.tsx:
// isLoading → 5 divs data-testid="skeleton-row" con Skeleton;
// !data?.items.length → EmptyState icon Megaphone title "Sin comunicados"
//   description "Todavía no hay comunicados para mostrar.";
// items.map → AnnouncementCard con isUnread={!readIds?.has(a.id)} (solo si
//   status !== 'draft': los borradores nunca son "unread"),
//   targetLabel={courseNames?.[a.targetId]}, onOpen;
// footer paginación idéntico a alerts-list (Página X de Y (Z total)).
```

```tsx
// for-me-list.tsx — mismo contenedor visual, sin paginación ni filtros;
// empty "Sin comunicados para vos" / description "No hay anuncios dirigidos
// a tu perfil por ahora."; items con unread dots siempre activos.
```

`index.ts` barrel con exports + types de los 4 componentes. Registrar en `packages/ui/src/index.tsx` (tras alerts).

- [ ] **Step 4: Run PASS** — mismo comando vitest → PASS. `biome check --write` sobre los archivos.

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/features/announcements packages/ui/src/index.tsx
git commit -m "feat(ui): announcements list cards and targeting badge"
```

---

### Task 6: Formulario + target select

**Files:**
- Create: `packages/ui/src/components/features/announcements/announcement-target-select.tsx`
- Create: `packages/ui/src/components/features/announcements/announcement-form.tsx`
- Modify: `packages/ui/src/components/features/announcements/index.ts`
- Test: `packages/ui/src/components/features/announcements/announcement-target-select.test.tsx`

**Interfaces:**
- Consumes: `createAnnouncementSchema`, `CreateAnnouncementFormValues`, `LevelTargetOption` (Task 1); `ICourseResponse`; primitives `Form/Input/Textarea/Button/RadioGroup/Select/Label/Card`.
- Produces:
  - `AnnouncementTargetSelect({targetType, targetId, courses, disabled?, onTargetTypeChange, onTargetIdChange}: {...})` — RadioGroup horizontal (Toda la escuela / Un curso / Un nivel) + Select condicional: course → cursos (`fullName`, value=id), level → Primaria/Secundaria (values lowercase). Sin Form wrappers (los pone el form).
  - `AnnouncementFormProps {mode: 'create'|'edit'; courses: ICourseResponse[]; isLoadingCourses?; defaultValues?: Partial<CreateAnnouncementFormValues>; isSubmitting?; errorMessage?; onSubmit(values: CreateAnnouncementFormValues): Promise<void> | void; onCancel?}` — RHF+zodResolver; título Input; contenido Textarea min-h-32; target select; publishAt Input datetime-local SOLO en mode create (label "Programar publicación (opcional)"); banner rojo errorMessage; submit "Publicar comunicado"/"Guardar cambios"; cancel variant ghost.
  - Nota edición: el PUT no acepta publishAt → la página edit ignora ese campo al armar el payload.

- [ ] **Step 1: Write failing test** `announcement-target-select.test.tsx`: (1) renderiza radios Toda la escuela/Un curso/Un nivel; (2) targetType course + courses fixture → option "5°A" presente; (3) targetType level → opciones Primaria y Secundaria con values `primary`/`secondary`; (4) cambiar radio llama onTargetTypeChange.

- [ ] **Step 2: Run FAIL.**

- [ ] **Step 3: Implementar** (RadioGroup con `grid grid-cols-3 gap-2`; Selects con patrón `'NONE'` sentinel NO necesario — targetId requerido condicionalmente, placeholder `<SelectItem disabled>` no: simplemente sin selección inicial y mensaje zod al enviar).

Estructura form (seguir course-form.tsx): `useForm<CreateAnnouncementFormValues>({resolver: zodResolver(createAnnouncementSchema), defaultValues: {title:'',body:'',targetType:'school',targetId:'',publishAt:null,...defaultValues}})`; `watch('targetType')` para condicional del select; Card wrapper max-w-2xl space-y-6; grid md:grid-cols-2 para título/tipo; contenido full-width.

- [ ] **Step 4: Run PASS + biome + build dist ui.**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/features/announcements/
git commit -m "feat(ui): announcement form with audience targeting"
```

---

### Task 7: Detalle + acciones

**Files:**
- Create: `packages/ui/src/components/features/announcements/announcement-detail.tsx`
- Modify: `packages/ui/src/components/features/announcements/index.ts`
- Test: `packages/ui/src/components/features/announcements/announcement-detail.test.tsx`

**Interfaces:**
- Consumes: `formatDateTime`, `formatRelative`, `TargetBadge`, `AlertDialog` primitive, `Button`.
- Produces: `AnnouncementDetailProps {announcement: Announcement | null; isLoading?; isError?; isBusy?; canPublish?; canEdit?; canDelete?; onBack?(); onPublish?(); onEdit?(); onDelete?()}` — Card: back link "← Volver", título xl, meta (autor · fecha completa + relativa), badges (estado + target), body `whitespace-pre-wrap leading-relaxed`, footer acciones: Publicar ahora (default, si canPublish), Editar (outline, canEdit), Eliminar (destructive outline, canDelete, con AlertDialog interno "¿Eliminar comunicado?" → onDelete tras confirm). Loading → Skeleton; error → ErrorState shared.

- [ ] **Step 1: Write failing test**: (1) muestra título/body/meta; (2) draft + canPublish muestra botón "Publicar ahora" y llama onPublish; (3) published no muestra Publicar/Edit; (4) canDelete + confirm del AlertDialog llama onDelete; (5) loading muestra skeleton (`data-testid="detail-skeleton"`).

- [ ] **Step 2: Run FAIL.**

- [ ] **Step 3: Implementar.**

- [ ] **Step 4: Run PASS + biome.**

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/components/features/announcements/
git commit -m "feat(ui): announcement detail with lifecycle actions"
```

---

### Task 8: Navegación — `nav.ts` + guards + ruta de app

**Files:**
- Modify: `packages/common/src/constants/nav.ts`
- Modify: `packages/common/src/constants/nav.test.ts` (si existe test de nav — verificar; hay `src/constants/nav.test.ts` en common: actualizar expectativas)

**Interfaces:**
- Produces: entradas nav "Comunicados" `[ROLES.ADMIN, ROLES.PRECEPTOR]` href `/announcements`; "Para mí" `[SUPERADMIN, ADMIN, PRECEPTOR, TEACHER]` href `/me/announcements` icon `Inbox`. `allowedRolesForPathname`: `/me/announcements` → todos; `/announcements` exacto o `/announcements/create` o `*/edit` → admin+preceptor; cualquier otro `/announcements/*` (detalle) → todos (teachers abren detalle híbrido).

- [ ] **Step 1: Actualizar/crear tests primero** en `nav.test.ts`: teacher permitido en `/me/announcements` y `/announcements/<uuid>`; teacher bloqueado en `/announcements`, `/announcements/create`, `/announcements/x/edit`; getNavConfig(TEACHER) incluye Para mí pero NO Comunicados.

- [ ] **Step 2: Run FAIL** (`pnpm --filter @repo/common exec vitest run src/constants/nav.test.ts`).

- [ ] **Step 3: Implementar** cambios en nav.ts (usar `APP_ROUTES.meAnnouncements`).

```ts
// allowedRolesForPathname — insertar ANTES del bloque genérico:
if (pathname.startsWith('/me/announcements'))
	return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
if (
	pathname === APP_ROUTES.announcements ||
	pathname === `${APP_ROUTES.announcements}/create` ||
	pathname.endsWith('/edit')
)
	return [ROLES.ADMIN, ROLES.PRECEPTOR];
if (pathname.startsWith(`${APP_ROUTES.announcements}/`))
	return [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.PRECEPTOR, ROLES.TEACHER];
```

- [ ] **Step 4: Run PASS + rebuild common + Commit**

```bash
git add packages/common/src/constants/nav.ts packages/common/src/constants/nav.test.ts
git commit -m "feat(common): split announcements navigation by role"
```

---

### Task 9: Páginas `apps/client` (4 rutas) cableando todo

**Files:**
- Modify: `apps/client/src/app/(dashboard)/announcements/page.tsx` (stub → controller)
- Create: `apps/client/src/app/(dashboard)/announcements/create/page.tsx`
- Create: `apps/client/src/app/(dashboard)/announcements/[id]/page.tsx`
- Create: `apps/client/src/app/(dashboard)/announcements/[id]/edit/page.tsx`
- Create: `apps/client/src/app/(dashboard)/me/announcements/page.tsx`

**Interfaces:**
- Consumes: todo lo anterior + `useAuth()` (provider local, `user.role/user.id`), `useActiveAcademicYear`, `useCourses`/`useMyCourses`, `useAnnouncements`, `useAnnouncement`, `useCreateAnnouncement`, `useUpdateAnnouncement`, `usePublishAnnouncement`, `useDeleteAnnouncement`, `useRelevantAnnouncements`, `useReadAnnouncements`, componentes de `@repo/ui`, `LoadingSpinner`/`ErrorState` (shared, patrón students/[id]).
- Produces: rutas navegables; patrón URL-state (`updateQueryParams` con URLSearchParams copiado de students/page.tsx).

- [ ] **Step 1: `/announcements`** — `'use client'`; `const {user}=useAuth()`; `isManager=['admin','preceptor'].includes(user?.role?.toLowerCase())` (si false → `<ForbiddenState/>` shared, patrón existente); `searchParams` page/status/targetType; `useAnnouncements({...})`; `useActiveAcademicYear` + `useCourses({academicYearId})` → `courseNames = Object.fromEntries(courses.map(c=>[c.id,c.fullName]))`; PageHeader title "Comunicados" description "Anuncios de la institución" + acción: Link a `/announcements/create` (Button "Nuevo comunicado"); barra de filtros: dos Select (Estado: Todos/Publicados/Borradores; Audiencia: Todas/Escuela/Curso/Nivel) escribiendo URL state y reseteando page a 1; render `<AnnouncementsList data isLoading readIds courseNames statusVisible onOpen={(a)=>router.push(\`/announcements/\${a.id}\`)} onPageChange={...}>`. `useEffect markRead` NO acá.

- [ ] **Step 2: `/announcements/create`** — gate manager; `useCourses` para el select; `useCreateAnnouncement()`; `handleSubmit(values)` → `mutateAsync({...values, publishAt: serializePublishAt(values.publishAt)})` en try/catch → setError(axios message) / éxito: `router.push('/announcements')`; `<AnnouncementForm mode="create" courses isLoadingCourses onSubmit onCancel={()=>router.back()} isSubmitting={isPending} errorMessage>`.

- [ ] **Step 3: `/announcements/[id]`** (híbrido):
```tsx
const { user } = useAuth();
const isManager = /* admin|preceptor */;
const apiDetail = useAnnouncement(id); // hook existente; enabled solo si manager
// hook existente: verificar campo enabled — si no soporta enabled, usar
// useQuery manual con queryKeys.announcements.detail(id) + enabled
const cached = useQueryClient().getQueryData<Announcement[]>(queryKeys.announcements.forMe)?.find(a=>a.id===id);
const announcement = isManager ? apiDetail.data ?? cached ?? null : cached ?? null;
const { readIds, markRead } = useReadAnnouncements(user?.id);
useEffect(() => { if (announcement) markRead(announcement.id); }, [announcement, markRead]);
const publish = usePublishAnnouncement(); const remove = useDeleteAnnouncement();
// handlers con try/catch; delete → router.push('/announcements')
render: <AnnouncementDetail announcement isLoading={isManager&&apiDetail.isLoading}
  isError={isManager&&apiDetail.isError&&!cached} isUnread={!readIds.has(id)}
  targetLabel={courseNames?.[announcement?.targetId ?? '']}
  canPublish={isManager&&announcement?.status==='draft'}
  canEdit={isManager&&announcement?.status==='draft'}
  canDelete={user?.role?.toLowerCase()==='admin'}
  isBusy={publish.isPending||remove.isPending}
  onBack={()=>router.push('/announcements')} onPublish={...} onEdit={()=>router.push(`/announcements/${id}/edit`)} onDelete={...}/>
```
`courseNames`: si preceptor → de `useMyCourses`; si admin → `useCourses`. Si no hay mapa, undefined (badge cae a "Dirigido"/"Toda la escuela").

- [ ] **Step 4: `/announcements/[id]/edit`** — gate manager; `useAnnouncement(id)`; loading → spinner; `<AnnouncementForm mode="edit" defaultValues={{title,body,targetType,targetId}} courses onSubmit={({title,body,targetType,targetId})=>mutateAsync({id,data:{title,body,targetType,targetId}})} ...>` → push detalle.

- [ ] **Step 5: `/me/announcements`** — todos los roles; `useAuth` (role/id); `useActiveAcademicYear`; `useRelevantAnnouncements({role:user?.role, userId:user?.id, academicYearId});` courseNames solo preceptor (myCourses); `markRead` en `onOpen` ANTES de navegar (optimista, además el efecto del detalle re-marca); `<ForMeList announcements isLoading readIds courseNames onOpen>`; PageHeader title "Para mí" description "Comunicados dirigidos a vos".

- [ ] **Step 6: Verificación manual de compilación** — `pnpm --filter @repo/common --filter @repo/hooks --filter @repo/ui run build && pnpm ts:check` → exit 0. `pnpm exec biome check --write apps/client/src/app` sobre archivos tocados.

- [ ] **Step 7: Commit**

```bash
git add "apps/client/src/app/(dashboard)/announcements" "apps/client/src/app/(dashboard)/me/announcements"
git commit -m "feat(client): announcements pages with for-me feed"
```

---

### Task 10: Verificación final del sprint (criterios de aceptación)

- [ ] **Step 1:** `pnpm ts:check` (turbo, 5 pkgs) → 5/5 OK.
- [ ] **Step 2:** `pnpm lint:check` → 0 errores biome (LF incluidos).
- [ ] **Step 3:** Suites: common (17+N), hooks (3+N), ui (28+N) → todas PASS.
- [ ] **Step 4:** Criterios del doc: listado paginado con badges ✓ (Task 5/9), crear con targeting según permisos ✓ (Task 6/9), para mí filtrado por rol ✓ (Task 3/9), marcar leído al abrir detalle ✓ (Task 2/9 Step 3), bell de alertas intacta (no tocar topbar) ✓.
- [ ] **Step 5:** Resumen al usuario + recordatorio: probar flujo con `pnpm dev` (API + client) creando comunicado school/curso/nivel y verificando dot/unread con usuario teacher vs preceptor.

## Self-Review Notes

- Cobertura spec: horas del doc cubiertas (common T1/T8, hooks T2/T3, ui T4-T7, client T9); decisiones aprobadas (merge client-side T3, gestión completa T6/T7/T9 Step 3-4, dos entradas nav T8) mapeadas a tareas.
- Contrato verificado contra código backend real, no contra el doc desactualizado (targeting `targetType/targetId`; niveles lowercase; roles por endpoint).
- Riesgos conocidos: (a) `useAnnouncement` puede no exponer `enabled` → fallback documentado en T9 Step 3; (b) teacher no obtiene labels de curso (solo courseIds de materias) → badges caen a "Dirigido"; aceptado en diseño; (c) casing de level en for-me es tolerante (handler normaliza), en create estricto lowercase (schema T1 fija esto).
