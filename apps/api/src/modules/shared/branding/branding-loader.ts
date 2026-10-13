import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	type BrandingFile,
	brandingFileSchema,
	formatBrandingError,
} from '@repo/branding';

export const BRANDING_FILE_NAME = 'branding.json';

export interface LoadedInstanceBranding {
	file: BrandingFile;
	version: string;
}

/**
 * Lee y valida `<dir>/branding.json`.
 * - Devuelve `null` si el archivo no existe.
 * - Lanza si el JSON es inválido, si algún campo no cumple el schema o si
 *   algún asset declarado no existe en `dir`.
 * - `version` es el sha256 (10 hex) de `branding.json` más los bytes de los assets.
 */
export const loadInstanceBranding = (
	dir: string,
): LoadedInstanceBranding | null => {
	const filePath = join(dir, BRANDING_FILE_NAME);
	if (!existsSync(filePath)) return null;

	const raw = readFileSync(filePath);

	let json: unknown;
	try {
		json = JSON.parse(raw.toString('utf8'));
	} catch (error) {
		throw new Error(
			`${BRANDING_FILE_NAME} inválido: ${error instanceof Error ? error.message : String(error)}`,
		);
	}

	const parsed = brandingFileSchema.safeParse(json);
	if (!parsed.success) {
		throw new Error(
			`${BRANDING_FILE_NAME} inválido: ${formatBrandingError(parsed.error)}`,
		);
	}
	const file = parsed.data;

	const hash = createHash('sha256').update(raw);
	const assetNames = [...new Set(Object.values(file.assets))].filter(
		(name): name is string => typeof name === 'string',
	);
	for (const name of assetNames) {
		const assetPath = join(dir, name);
		if (!existsSync(assetPath)) {
			throw new Error(
				`${BRANDING_FILE_NAME} inválido: falta el asset "${name}" en ${dir}`,
			);
		}
		hash.update(readFileSync(assetPath));
	}

	return { file, version: hash.digest('hex').slice(0, 10) };
};
