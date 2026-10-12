import * as envVar from 'env-var';

export interface BrandingConfig {
	BRANDING_DIR: string;
}

export const getBrandingConfig = (
	envSource: Record<string, string | undefined> = process.env,
): BrandingConfig => {
	const env = envVar.from(envSource);

	return {
		BRANDING_DIR: env.get('BRANDING_DIR').default('/app/branding').asString(),
	};
};
