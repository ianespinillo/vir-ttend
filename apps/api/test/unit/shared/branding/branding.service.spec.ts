import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { VIRTTEND_BRANDING } from '@repo/branding';
import { BrandingService } from '../../../../src/modules/shared/branding/branding.service';

const EEST3_DIR = path.resolve(
	__dirname,
	'../../../../../../deploy/branding/eest3',
);

describe('BrandingService', () => {
	const originalEnv = { ...process.env };

	const setEnv = (env: Record<string, string>) => {
		process.env = { ...originalEnv, ...env };
	};

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it('uses the Vir-ttend brand in multi mode even with a valid BRANDING_DIR', () => {
		setEnv({ TENANCY_MODE: 'multi', BRANDING_DIR: EEST3_DIR });
		const service = new BrandingService();
		service.onModuleInit();

		expect(service.getPublicBranding().source).toBe('virttend');
		expect(service.getPublicBranding()).toEqual(VIRTTEND_BRANDING);
		expect(service.getAssetsDir()).toBeNull();
	});

	it('uses the instance brand in single mode', () => {
		setEnv({
			TENANCY_MODE: 'single',
			TENANT_ID: '00000000-0000-0000-0000-000000000001',
			TENANT_SLUG: 'eest3',
			BRANDING_DIR: EEST3_DIR,
		});
		const service = new BrandingService();
		service.onModuleInit();

		const branding = service.getPublicBranding();
		expect(branding.source).toBe('instance');
		expect(branding.showPoweredBy).toBe(true);
		expect(branding.colors.primary).toBe('#023064');
		expect(branding.assets.crestSmall).toMatch(
			/^\/branding\/crest-small\.svg\?v=[0-9a-f]{10}$/,
		);
		expect(service.getAssetsDir()).toBe(EEST3_DIR);
	});

	it('falls back to Vir-ttend in single mode without branding.json', () => {
		setEnv({
			TENANCY_MODE: 'single',
			TENANT_ID: '00000000-0000-0000-0000-000000000001',
			TENANT_SLUG: 'eest3',
			BRANDING_DIR: path.join(EEST3_DIR, 'no-existe'),
		});
		const service = new BrandingService();
		service.onModuleInit();

		expect(service.getPublicBranding()).toEqual(VIRTTEND_BRANDING);
		expect(service.getAssetsDir()).toBeNull();
	});

	it('resolves lazily so main.ts can read the assets dir before onModuleInit', () => {
		setEnv({
			TENANCY_MODE: 'single',
			TENANT_ID: '00000000-0000-0000-0000-000000000001',
			TENANT_SLUG: 'eest3',
			BRANDING_DIR: EEST3_DIR,
		});
		const service = new BrandingService();

		expect(service.getAssetsDir()).toBe(EEST3_DIR);
	});

	it('fails the boot when branding.json is invalid in single mode', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'branding-'));
		try {
			fs.writeFileSync(
				path.join(dir, 'branding.json'),
				JSON.stringify({
					version: 1,
					displayName: 'Escuela',
					shortName: 'Esc',
					colors: { primary: 'azul' },
				}),
			);
			setEnv({
				TENANCY_MODE: 'single',
				TENANT_ID: '00000000-0000-0000-0000-000000000001',
				TENANT_SLUG: 'x',
				BRANDING_DIR: dir,
			});

			expect(() => new BrandingService().onModuleInit()).toThrow(/colors.primary/);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});
