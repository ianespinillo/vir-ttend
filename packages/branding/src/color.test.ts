import { describe, expect, it } from 'vitest';
import {
	contrastRatio,
	hexToHslTriplet,
	hexToRgbTriplet,
	isHex,
	mix,
	normalizeHex,
} from './color.js';

describe('color', () => {
	it('computes the WCAG contrast ratio', () => {
		expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 1);
		expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
	});

	it('validates and normalizes hex colors', () => {
		expect(isHex('#023064')).toBe(true);
		expect(isHex('azul')).toBe(false);
		expect(isHex('#FFF')).toBe(false);
		expect(normalizeHex('#c6f432')).toBe('#C6F432');
	});

	it('mixes towards another color', () => {
		expect(mix('#000000', '#FFFFFF', 0)).toBe('#000000');
		expect(mix('#000000', '#FFFFFF', 1)).toBe('#FFFFFF');
		expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
	});

	it('formats HSL triplets like shadcn variables', () => {
		expect(hexToHslTriplet('#FFFFFF')).toBe('0 0% 100%');
		expect(hexToHslTriplet('#000000')).toBe('0 0% 0%');
		expect(hexToHslTriplet('#FF0000')).toBe('0 100% 50%');
		expect(hexToHslTriplet('#00FF00')).toBe('120 100% 50%');
		expect(hexToHslTriplet('#0000FF')).toBe('240 100% 50%');
		expect(hexToHslTriplet('#14213D')).toBe('221 50.6% 15.9%');
	});

	it('formats RGB triplets for NativeWind', () => {
		expect(hexToRgbTriplet('#14213D')).toBe('20 33 61');
		expect(hexToRgbTriplet('#C6F432')).toBe('198 244 50');
	});
});
