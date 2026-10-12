import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
	type PublicBranding,
	VIRTTEND_BRANDING,
	deriveBrandTokens,
	resolveBranding,
} from '@repo/branding';
import { getTenancyConfig } from '../config/tenancy.config';
import {
	type LoadedInstanceBranding,
	loadInstanceBranding,
} from './branding-loader';
import { getBrandingConfig } from './branding.config';

interface ResolvedState {
	branding: PublicBranding;
	assetsDir: string | null;
}

@Injectable()
export class BrandingService implements OnModuleInit {
	private readonly logger = new Logger(BrandingService.name);
	private state: ResolvedState | null = null;

	/** Carga eager: un branding.json inválido hace fallar el boot. */
	onModuleInit(): void {
		this.load();
	}

	getPublicBranding(): PublicBranding {
		return this.load().branding;
	}

	getAssetsDir(): string | null {
		return this.load().assetsDir;
	}

	/**
	 * Memoizada. `main.ts` necesita `getAssetsDir()` antes de `app.listen()`,
	 * que es cuando Nest ejecuta `onModuleInit`, así que los getters también cargan.
	 */
	private load(): ResolvedState {
		if (!this.state) this.state = this.resolve();
		return this.state;
	}

	private resolve(): ResolvedState {
		const { TENANCY_MODE } = getTenancyConfig();
		if (TENANCY_MODE !== 'single') {
			return { branding: VIRTTEND_BRANDING, assetsDir: null };
		}

		const { BRANDING_DIR } = getBrandingConfig();
		const instance: LoadedInstanceBranding | null =
			loadInstanceBranding(BRANDING_DIR);

		if (!instance) {
			this.logger.warn(
				`Instancia single sin branding.json en ${BRANDING_DIR}: se usa la marca Vir-ttend`,
			);
			return { branding: VIRTTEND_BRANDING, assetsDir: null };
		}

		const branding = resolveBranding({ mode: TENANCY_MODE, instance });
		if (!deriveBrandTokens(branding.colors).usable) {
			this.logger.warn(
				'Branding con contraste insuficiente, se usa Vir-ttend en los clientes',
			);
		}
		return { branding, assetsDir: BRANDING_DIR };
	}
}
