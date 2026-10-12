import type {
	AppVariant,
	StaticAppInfo,
	TenancyMode,
} from '../../config/app-config';
import type { PublicConfig } from './public-config';
import type { ServerConfigStatus } from './use-server-config';

/** What the screens know about this deployment. */
export interface MobileAppConfig {
	/** Name of this app build (launcher label). */
	appName: string;
	/** School name when known, otherwise the app name. */
	displayName: string;
	/** School name, or `null` when the app is not tied to one school. */
	schoolName: string | null;
	/** `null` until the server (or its cached copy) has been read. */
	tenancyMode: TenancyMode | null;
	tenantId: string | null;
	apiUrl: string;
	variant: AppVariant;
	configStatus: ServerConfigStatus;
}

/**
 * Combines the build-time info with the server config. The school name comes
 * from the server in single mode, otherwise from the variant (a school's own
 * app knows its school before the server answers). Pure.
 */
export const buildMobileConfig = (
	app: StaticAppInfo,
	server: PublicConfig | null,
	configStatus: ServerConfigStatus,
): MobileAppConfig => {
	const schoolName =
		(server?.tenancyMode === 'single' ? server.tenantName : null) ??
		app.variantSchoolName;

	return {
		appName: app.appName,
		displayName: schoolName ?? app.appName,
		schoolName,
		tenancyMode: server?.tenancyMode ?? null,
		tenantId: server?.tenantId ?? null,
		apiUrl: app.apiUrl,
		variant: app.variant,
		configStatus,
	};
};
