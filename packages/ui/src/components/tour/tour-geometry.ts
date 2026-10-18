export interface Rect {
	top: number;
	left: number;
	width: number;
	height: number;
}

export interface Size {
	width: number;
	height: number;
}

export type CardPlacement = 'right' | 'bottom' | 'left' | 'top' | 'center';

export interface CardPosition {
	top: number;
	left: number;
	placement: CardPlacement;
}

/** Room left between the spotlight and the card. */
export const TOUR_GAP = 14;
/** Minimum distance between the card and the viewport edge. */
export const TOUR_MARGIN = 16;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Places the card next to the target, trying right, bottom, left and top in
 * that order (sidebar entries read best with the card to their right), and
 * keeps it inside the viewport. Without a target the card is centered.
 */
export function computeCardPosition(
	target: Rect | null,
	card: Size,
	viewport: Size,
): CardPosition {
	const maxTop = viewport.height - card.height - TOUR_MARGIN;
	const maxLeft = viewport.width - card.width - TOUR_MARGIN;

	if (!target) {
		return {
			top: clamp((viewport.height - card.height) / 2, TOUR_MARGIN, maxTop),
			left: clamp((viewport.width - card.width) / 2, TOUR_MARGIN, maxLeft),
			placement: 'center',
		};
	}

	const right = target.left + target.width;
	const bottom = target.top + target.height;
	const alignedTop = clamp(
		target.top + target.height / 2 - card.height / 2,
		TOUR_MARGIN,
		maxTop,
	);
	const alignedLeft = clamp(
		target.left + target.width / 2 - card.width / 2,
		TOUR_MARGIN,
		maxLeft,
	);

	if (right + TOUR_GAP + card.width + TOUR_MARGIN <= viewport.width) {
		return { top: alignedTop, left: right + TOUR_GAP, placement: 'right' };
	}
	if (bottom + TOUR_GAP + card.height + TOUR_MARGIN <= viewport.height) {
		return { top: bottom + TOUR_GAP, left: alignedLeft, placement: 'bottom' };
	}
	if (target.left - TOUR_GAP - card.width >= TOUR_MARGIN) {
		return {
			top: alignedTop,
			left: target.left - TOUR_GAP - card.width,
			placement: 'left',
		};
	}
	if (target.top - TOUR_GAP - card.height >= TOUR_MARGIN) {
		return {
			top: target.top - TOUR_GAP - card.height,
			left: alignedLeft,
			placement: 'top',
		};
	}
	return {
		top: clamp((viewport.height - card.height) / 2, TOUR_MARGIN, maxTop),
		left: clamp((viewport.width - card.width) / 2, TOUR_MARGIN, maxLeft),
		placement: 'center',
	};
}

/** The spotlight hugs the target with a little breathing room. */
export function padRect(rect: Rect, padding: number): Rect {
	return {
		top: rect.top - padding,
		left: rect.left - padding,
		width: rect.width + padding * 2,
		height: rect.height + padding * 2,
	};
}
