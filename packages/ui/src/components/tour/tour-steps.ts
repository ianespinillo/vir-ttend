import { ROLES, type Roles, getNavConfig } from '@repo/common';
import {
	TOUR_FINISH,
	TOUR_TENANT_SWITCHER,
	TOUR_WELCOME,
	getNavTourCopy,
} from './tour-content';

export interface TourStep {
	id: string;
	title: string;
	body: string;
	tips?: string[];
	/** CSS selector of the element to spotlight; centered card when absent. */
	target?: string;
	/** Page the tour opens before showing the step. */
	route?: string;
}

export interface BuildTourStepsOptions {
	tenancyMode?: 'multi' | 'single';
	/** Navigation entries the host app cannot open (e.g. demo-only gaps). */
	excludeHrefs?: string[];
}

export const TOUR_TRIGGER_SELECTOR = '[data-tour="tour-trigger"]';
export const TENANT_SWITCHER_SELECTOR = '[data-tour="tenant-switcher"]';

export function navTourSelector(href: string): string {
	return `[data-tour="nav:${href}"]`;
}

/**
 * Builds the tour of a role straight from its navigation, so every step
 * matches an entry the user actually sees in the sidebar.
 */
export function buildTourSteps(
	role: Roles,
	options: BuildTourStepsOptions = {},
): TourStep[] {
	const excluded = new Set(options.excludeHrefs ?? []);
	const navItems = getNavConfig(role, { tenancyMode: options.tenancyMode })
		.flatMap((group) => group.items)
		.filter((item) => !excluded.has(item.href));

	const welcome = TOUR_WELCOME[role];
	const steps: TourStep[] = [
		{ id: 'welcome', title: welcome.title ?? '', body: welcome.body },
	];

	if (role === ROLES.SUPERADMIN && options.tenancyMode !== 'single') {
		steps.push({
			id: 'tenant-switcher',
			title: TOUR_TENANT_SWITCHER.title ?? '',
			body: TOUR_TENANT_SWITCHER.body,
			target: TENANT_SWITCHER_SELECTOR,
		});
	}

	for (const item of navItems) {
		const copy = getNavTourCopy(item.href, role);
		if (!copy) continue;
		steps.push({
			id: `nav:${item.href}`,
			title: copy.title ?? item.label,
			body: copy.body,
			tips: copy.tips,
			target: navTourSelector(item.href),
			route: item.href,
		});
	}

	steps.push({
		id: 'finish',
		title: TOUR_FINISH.title ?? '',
		body: TOUR_FINISH.body,
		target: TOUR_TRIGGER_SELECTOR,
	});

	return steps;
}

/** Whether `pathname` is already inside the page a step points at. */
export function isOnRoute(pathname: string, route: string): boolean {
	if (pathname === route) return true;
	if (route === '/dashboard') return false;
	return pathname.startsWith(`${route}/`);
}
