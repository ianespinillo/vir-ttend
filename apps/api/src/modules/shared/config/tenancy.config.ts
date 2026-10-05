import * as envVar from 'env-var';

export type TenancyMode = 'multi' | 'single';

export interface TenancyConfig {
	TENANCY_MODE: TenancyMode;
	TENANT_ID: string | null;
	TENANT_SLUG: string | null;
	TENANT_NAME: string;
	SCHOOL_NAME: string;
	SCHOOL_LEVELS: string[];
	BOOTSTRAP_ADMIN_EMAIL: string | null;
	BOOTSTRAP_ADMIN_FIRST_NAME: string;
	BOOTSTRAP_ADMIN_LAST_NAME: string;
	BOOTSTRAP_ADMIN_PASSWORD: string | null;
	ALLOW_SUPERADMIN: boolean;
	INSTANCE_ID: string | null;
}

export const getTenancyConfig = (
	envSource: Record<string, string | undefined> = process.env,
): TenancyConfig => {
	const env = envVar.from(envSource);

	const mode = env
		.get('TENANCY_MODE')
		.default('multi')
		.asEnum(['multi', 'single']) as TenancyMode;

	const isSingle = mode === 'single';

	const tenantId = isSingle
		? env.get('TENANT_ID').required().asString()
		: (env.get('TENANT_ID').asString() ?? null);

	const tenantSlug = isSingle
		? env.get('TENANT_SLUG').required().asString()
		: (env.get('TENANT_SLUG').asString() ?? null);

	const tenantName =
		env.get('TENANT_NAME').asString() ?? tenantSlug ?? 'Colegio Institucional';

	const allowSuperadminDefault = !isSingle;
	const allowSuperadmin = env
		.get('ALLOW_SUPERADMIN')
		.default(String(allowSuperadminDefault))
		.asBool();

	return {
		TENANCY_MODE: mode,
		TENANT_ID: tenantId,
		TENANT_SLUG: tenantSlug,
		TENANT_NAME: tenantName,
		SCHOOL_NAME:
			env.get('SCHOOL_NAME').asString() ?? tenantName ?? 'Sede Principal',
		SCHOOL_LEVELS: env
			.get('SCHOOL_LEVELS')
			.default('PRIMARY,SECONDARY')
			.asArray(),
		BOOTSTRAP_ADMIN_EMAIL:
			env.get('BOOTSTRAP_ADMIN_EMAIL').asString() ??
			(tenantSlug ? `admin@${tenantSlug}.edu.ar` : null),
		BOOTSTRAP_ADMIN_FIRST_NAME: env
			.get('BOOTSTRAP_ADMIN_FIRST_NAME')
			.default('Administrador')
			.asString(),
		BOOTSTRAP_ADMIN_LAST_NAME: env
			.get('BOOTSTRAP_ADMIN_LAST_NAME')
			.default('Institucional')
			.asString(),
		BOOTSTRAP_ADMIN_PASSWORD:
			env.get('BOOTSTRAP_ADMIN_PASSWORD').asString() ?? null,
		ALLOW_SUPERADMIN: allowSuperadmin,
		INSTANCE_ID: env.get('INSTANCE_ID').asString() ?? tenantSlug ?? null,
	};
};
