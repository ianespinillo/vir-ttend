import { z } from 'zod';

export const announcementTargetTypes = ['school', 'course', 'level'] as const;

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
