import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { loadInstanceBranding } from '../../../../src/modules/shared/branding/branding-loader';

const EEST3_DIR = path.resolve(
	__dirname,
	'../../../../../../deploy/branding/eest3',
);

describe('loadInstanceBranding', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'branding-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	const writeJson = (value: unknown) =>
		fs.writeFileSync(path.join(tmpDir, 'branding.json'), JSON.stringify(value));

	it('loads the real eest3 branding with a 10-hex version', () => {
		const loaded = loadInstanceBranding(EEST3_DIR);

		expect(loaded).not.toBeNull();
		expect(loaded?.version).toMatch(/^[0-9a-f]{10}$/);
		expect(loaded?.file.colors.primary).toBe('#023064');
	});

	it('returns the same version for the same content', () => {
		expect(loadInstanceBranding(EEST3_DIR)?.version).toBe(
			loadInstanceBranding(EEST3_DIR)?.version,
		);
	});

	it('returns null when branding.json does not exist', () => {
		expect(loadInstanceBranding(tmpDir)).toBeNull();
	});

	it('returns null when the directory does not exist', () => {
		expect(loadInstanceBranding(path.join(tmpDir, 'missing'))).toBeNull();
	});

	it('throws naming the field when a color is invalid', () => {
		writeJson({
			version: 1,
			displayName: 'Escuela',
			shortName: 'Esc',
			colors: { primary: 'azul' },
		});

		expect(() => loadInstanceBranding(tmpDir)).toThrow(/colors\.primary/);
	});

	it('throws when branding.json is not valid JSON', () => {
		fs.writeFileSync(path.join(tmpDir, 'branding.json'), '{ no es json');

		expect(() => loadInstanceBranding(tmpDir)).toThrow(/branding\.json inválido/);
	});

	it('throws naming the file when a declared asset is missing', () => {
		writeJson({
			version: 1,
			displayName: 'Escuela',
			shortName: 'Esc',
			colors: { primary: '#023064' },
			assets: { crest: 'falta.png' },
		});

		expect(() => loadInstanceBranding(tmpDir)).toThrow(/falta\.png/);
	});

	it('changes the version when an asset changes', () => {
		writeJson({
			version: 1,
			displayName: 'Escuela',
			shortName: 'Esc',
			colors: { primary: '#023064' },
			assets: { crest: 'crest.png' },
		});
		fs.writeFileSync(path.join(tmpDir, 'crest.png'), 'uno');
		const first = loadInstanceBranding(tmpDir)?.version;

		fs.writeFileSync(path.join(tmpDir, 'crest.png'), 'dos');
		const second = loadInstanceBranding(tmpDir)?.version;

		expect(first).toMatch(/^[0-9a-f]{10}$/);
		expect(second).not.toBe(first);
	});
});
