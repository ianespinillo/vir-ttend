import { z } from 'zod';

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'debe ser un color #RRGGBB');
const assetName = z
	.string()
	.regex(
		/^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|webp|svg|ico)$/,
		'nombre de archivo inválido',
	);

export const brandingFileSchema = z.object({
	version: z.literal(1),
	displayName: z.string().trim().min(1).max(120),
	shortName: z.string().trim().min(1).max(40),
	colors: z.object({
		primary: hex,
		accent: hex.optional(),
		highlight: hex.optional(),
	}),
	assets: z
		.object({
			crest: assetName,
			crestSmall: assetName,
			crestSmallPng: assetName,
			favicon: assetName,
		})
		.partial()
		.default({}),
});
export type BrandingFile = z.infer<typeof brandingFileSchema>;

export const publicBrandingSchema = z.object({
	source: z.enum(['virttend', 'instance']),
	version: z.string().min(1),
	displayName: z.string(),
	shortName: z.string(),
	colors: z.object({
		primary: hex,
		accent: hex.nullable(),
		highlight: hex.nullable(),
	}),
	assets: z.object({
		crest: z.string().nullable(),
		crestSmall: z.string().nullable(),
		crestSmallPng: z.string().nullable(),
		favicon: z.string().nullable(),
	}),
	showPoweredBy: z.boolean(),
});
export type PublicBranding = z.infer<typeof publicBrandingSchema>;

export const formatBrandingError = (e: z.ZodError): string =>
	e.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
