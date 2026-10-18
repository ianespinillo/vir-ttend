import { describe, expect, it } from 'vitest';
import {
	TOUR_GAP,
	TOUR_MARGIN,
	computeCardPosition,
	padRect,
} from './tour-geometry';

const viewport = { width: 1280, height: 800 };
const card = { width: 352, height: 240 };

describe('computeCardPosition', () => {
	it('centers the card when there is no target', () => {
		expect(computeCardPosition(null, card, viewport)).toEqual({
			top: 280,
			left: 464,
			placement: 'center',
		});
	});

	it('puts the card to the right of a sidebar entry', () => {
		const target = { top: 200, left: 8, width: 240, height: 32 };
		const position = computeCardPosition(target, card, viewport);
		expect(position.placement).toBe('right');
		expect(position.left).toBe(248 + TOUR_GAP);
		expect(position.top).toBe(200 + 16 - 120);
	});

	it('falls back to below a target on the right edge', () => {
		const target = { top: 12, left: 1220, width: 40, height: 40 };
		const position = computeCardPosition(target, card, viewport);
		expect(position.placement).toBe('bottom');
		expect(position.top).toBe(52 + TOUR_GAP);
		expect(position.left).toBe(viewport.width - card.width - TOUR_MARGIN);
	});

	it('keeps the card inside the viewport', () => {
		const target = { top: 780, left: 8, width: 240, height: 20 };
		const position = computeCardPosition(target, card, viewport);
		expect(position.top).toBeLessThanOrEqual(
			viewport.height - card.height - TOUR_MARGIN,
		);
	});

	it('pins the card to the margin on a viewport smaller than the card', () => {
		const tiny = { width: 300, height: 200 };
		const position = computeCardPosition(null, card, tiny);
		expect(position).toEqual({
			top: TOUR_MARGIN,
			left: TOUR_MARGIN,
			placement: 'center',
		});
	});
});

describe('padRect', () => {
	it('grows the rect on every side', () => {
		expect(padRect({ top: 10, left: 10, width: 20, height: 20 }, 4)).toEqual({
			top: 6,
			left: 6,
			width: 28,
			height: 28,
		});
	});
});
