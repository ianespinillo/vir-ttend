'use client';

import { CircleHelp } from 'lucide-react';
import {
	type KeyboardEvent as ReactKeyboardEvent,
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useIsomorphicLayoutEffect } from '../../hooks/use-isomorphic-layout-effect';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
	type Rect,
	type Size,
	computeCardPosition,
	padRect,
} from './tour-geometry';
import {
	type TourStep,
	type TutorialDefinition,
	isOnRoute,
} from './tour-steps';
import {
	type TourStorage,
	defaultTourStorage,
	hasSeenTour,
	markTourSeen,
} from './tour-storage';

export interface TourContextValue {
	isOpen: boolean;
	activeTutorialId: string | null;
	tutorials: TutorialDefinition[];
	start: (tutorialId?: string) => void;
	close: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

/** The surrounding tour, or null outside a TourProvider. */
export function useTour(): TourContextValue | null {
	return useContext(TourContext);
}

export interface TourProviderProps {
	steps?: TourStep[];
	tutorials?: TutorialDefinition[];
	defaultTutorialId?: string;
	/** Identifies whose "tour seen" flag this is (e.g. user id + role). */
	storageKey: string;
	/** While false the tour neither starts nor stays open. */
	enabled?: boolean;
	/** Start on its own the first time `storageKey` is seen. */
	autoStart?: boolean;
	autoStartDelayMs?: number;
	currentPath: string;
	onNavigate?: (href: string) => void;
	storage?: TourStorage | null;
	children: ReactNode;
}

export function TourProvider({
	steps: fallbackSteps = [],
	tutorials = [],
	defaultTutorialId,
	storageKey,
	enabled = true,
	autoStart = true,
	autoStartDelayMs = 700,
	currentPath,
	onNavigate,
	storage,
	children,
}: TourProviderProps) {
	const [activeTutorialId, setActiveTutorialId] = useState<string | null>(
		defaultTutorialId ?? tutorials[0]?.id ?? null,
	);
	const [index, setIndex] = useState<number | null>(null);
	const currentPathRef = useRef(currentPath);
	const startPathRef = useRef<string | null>(null);
	const onNavigateRef = useRef(onNavigate);
	currentPathRef.current = currentPath;
	onNavigateRef.current = onNavigate;

	const resolveStorage = useCallback(
		() => (storage === undefined ? defaultTourStorage() : storage),
		[storage],
	);

	const activeTutorial = useMemo(() => {
		if (!activeTutorialId) return tutorials[0] ?? null;
		return (
			tutorials.find((t) => t.id === activeTutorialId) ?? tutorials[0] ?? null
		);
	}, [activeTutorialId, tutorials]);

	const currentSteps = useMemo(() => {
		if (activeTutorial) return activeTutorial.steps;
		return fallbackSteps;
	}, [activeTutorial, fallbackSteps]);

	const start = useCallback(
		(tutorialId?: string) => {
			const targetId = tutorialId ?? defaultTutorialId ?? tutorials[0]?.id ?? null;
			const targetTutorial = targetId
				? tutorials.find((t) => t.id === targetId)
				: null;
			const targetSteps = targetTutorial
				? targetTutorial.steps
				: fallbackSteps.length > 0
					? fallbackSteps
					: (tutorials[0]?.steps ?? []);

			if (targetSteps.length === 0) return;

			if (targetId) setActiveTutorialId(targetId);
			startPathRef.current = currentPathRef.current;
			setIndex(0);
		},
		[defaultTutorialId, fallbackSteps, tutorials],
	);

	const close = useCallback(() => {
		markTourSeen(resolveStorage(), storageKey);
		setIndex(null);
		const startPath = startPathRef.current;
		startPathRef.current = null;
		if (startPath && startPath !== currentPathRef.current) {
			onNavigateRef.current?.(startPath);
		}
	}, [resolveStorage, storageKey]);

	// A new user/role (e.g. the demo's role switcher) gets its own tour.
	useEffect(() => {
		setIndex(null);
		if (!enabled || !autoStart || currentSteps.length === 0) return;
		if (hasSeenTour(resolveStorage(), storageKey)) return;
		const timer = window.setTimeout(() => {
			startPathRef.current = currentPathRef.current;
			setIndex(0);
		}, autoStartDelayMs);
		return () => window.clearTimeout(timer);
		// Steps are left out on purpose: a late tenancy config must not
		// restart a tour that is already running.
	}, [enabled, autoStart, autoStartDelayMs, storageKey, resolveStorage]);

	const lastIndex = currentSteps.length - 1;
	const activeIndex = index === null ? null : Math.min(index, lastIndex);
	const step = activeIndex === null ? null : currentSteps[activeIndex];

	// Each step opens its page; the sidebar entry stays in place meanwhile.
	useEffect(() => {
		if (!step?.route) return;
		if (isOnRoute(currentPathRef.current, step.route)) return;
		onNavigateRef.current?.(step.route);
	}, [step?.route]);

	const contextValue = useMemo<TourContextValue>(
		() => ({
			isOpen: step !== null,
			activeTutorialId,
			tutorials,
			start,
			close,
		}),
		[step, activeTutorialId, tutorials, start, close],
	);

	return (
		<TourContext.Provider value={contextValue}>
			{children}
			{step && activeIndex !== null && (
				<TourOverlay
					step={step}
					index={activeIndex}
					total={currentSteps.length}
					tutorialTitle={activeTutorial?.badge ?? activeTutorial?.title}
					onPrev={() => setIndex(Math.max(activeIndex - 1, 0))}
					onNext={() =>
						activeIndex >= lastIndex ? close() : setIndex(activeIndex + 1)
					}
					onSkip={close}
				/>
			)}
		</TourContext.Provider>
	);
}

/** Topbar button that replays or selects a tour; also the anchor of its last step. */
export function TourTriggerButton({ className }: { className?: string }) {
	const tour = useTour();
	if (!tour) return null;

	const hasMultipleTours = tour.tutorials && tour.tutorials.length > 1;

	if (!hasMultipleTours) {
		return (
			<Button
				type="button"
				variant="ghost"
				size="icon"
				data-tour="tour-trigger"
				aria-label="Ver tutorial"
				title="Ver tutorial"
				onClick={() => tour.start()}
				className={cn('h-9 w-9 rounded-full text-muted-foreground', className)}
			>
				<CircleHelp />
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					data-tour="tour-trigger"
					aria-label="Ver tutorial"
					title="Ver tutoriales y guías"
					className={cn('h-9 w-9 rounded-full text-muted-foreground', className)}
				>
					<CircleHelp />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-80 p-1.5">
				<DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wider px-2 py-1.5">
					Tutoriales y Guías
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="my-1" />
				<div className="flex flex-col gap-1">
					{tour.tutorials.map((tutorial) => (
						<DropdownMenuItem
							key={tutorial.id}
							onClick={() => tour.start(tutorial.id)}
							className="flex flex-col items-start gap-1 p-2 rounded-md cursor-pointer hover:bg-accent focus:bg-accent"
						>
							<div className="flex items-center justify-between w-full gap-2">
								<span className="font-medium text-sm text-foreground">
									{tutorial.title}
								</span>
								{tutorial.badge && (
									<span className="text-[10px] font-semibold text-primary bg-primary-ink/10 px-1.5 py-0.5 rounded shrink-0">
										{tutorial.badge}
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground leading-snug line-clamp-2">
								{tutorial.description}
							</p>
						</DropdownMenuItem>
					))}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const SPOTLIGHT_PADDING = 6;
const TARGET_RETRY_MS = 100;
const TARGET_MAX_RETRIES = 20;
const FALLBACK_CARD_SIZE: Size = { width: 352, height: 240 };

function sameRect(a: Rect | null, b: Rect | null): boolean {
	if (a === b) return true;
	if (!a || !b) return false;
	return (
		a.top === b.top &&
		a.left === b.left &&
		a.width === b.width &&
		a.height === b.height
	);
}

function measure(selector: string): { el: Element; rect: Rect } | null {
	const el = document.querySelector(selector);
	if (!el) return null;
	const box = el.getBoundingClientRect();
	if (box.width === 0 && box.height === 0) return null;
	return {
		el,
		rect: {
			top: box.top,
			left: box.left,
			width: box.width,
			height: box.height,
		},
	};
}

/**
 * Tracks where the step's target is on screen. The target may render a
 * moment later (page change) or not at all (e.g. the sidebar is a closed
 * sheet on mobile); after a short wait the step falls back to a centered card.
 */
function useTargetRect(selector: string | undefined): Rect | null {
	const [rect, setRect] = useState<Rect | null>(null);

	useIsomorphicLayoutEffect(() => {
		if (!selector) {
			setRect(null);
			return;
		}
		let frame = 0;
		let retry: number | undefined;
		let attempts = 0;
		let observer: ResizeObserver | null = null;

		const update = (found: Rect | null) =>
			setRect((prev) => (sameRect(prev, found) ? prev : found));
		const remeasure = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => update(measure(selector)?.rect ?? null));
		};
		const find = () => {
			const hit = measure(selector);
			if (hit) {
				hit.el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
				update(measure(selector)?.rect ?? hit.rect);
				if (typeof ResizeObserver !== 'undefined') {
					observer = new ResizeObserver(remeasure);
					observer.observe(hit.el);
					observer.observe(document.documentElement);
				}
				return;
			}
			attempts += 1;
			if (attempts > TARGET_MAX_RETRIES) {
				update(null);
				return;
			}
			retry = window.setTimeout(find, TARGET_RETRY_MS);
		};

		find();
		window.addEventListener('resize', remeasure);
		window.addEventListener('scroll', remeasure, true);
		return () => {
			cancelAnimationFrame(frame);
			window.clearTimeout(retry);
			observer?.disconnect();
			window.removeEventListener('resize', remeasure);
			window.removeEventListener('scroll', remeasure, true);
		};
	}, [selector]);

	return selector ? rect : null;
}

function useViewport(): Size {
	const read = () => ({ width: window.innerWidth, height: window.innerHeight });
	const [viewport, setViewport] = useState<Size>(read);
	useEffect(() => {
		const onResize = () => setViewport(read());
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);
	return viewport;
}

const FOCUSABLE =
	'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

interface TourOverlayProps {
	step: TourStep;
	index: number;
	total: number;
	tutorialTitle?: string;
	onPrev: () => void;
	onNext: () => void;
	onSkip: () => void;
}

function TourOverlay({
	step,
	index,
	total,
	tutorialTitle,
	onPrev,
	onNext,
	onSkip,
}: TourOverlayProps) {
	const titleId = useId();
	const bodyId = useId();
	const cardRef = useRef<HTMLDivElement>(null);
	const nextRef = useRef<HTMLButtonElement>(null);
	const [cardSize, setCardSize] = useState<Size>(FALLBACK_CARD_SIZE);
	const target = useTargetRect(step.target);
	const viewport = useViewport();

	const isFirst = index === 0;
	const isLast = index === total - 1;

	useIsomorphicLayoutEffect(() => {
		const card = cardRef.current;
		if (!card) return;
		const size = { width: card.offsetWidth, height: card.offsetHeight };
		setCardSize((prev) =>
			prev.width === size.width && prev.height === size.height ? prev : size,
		);
	});

	// Focus follows the step; the page regains it when the tour closes.
	useEffect(() => {
		const previous = document.activeElement as HTMLElement | null;
		return () => previous?.focus?.({ preventScroll: true });
	}, []);
	useEffect(() => {
		nextRef.current?.focus({ preventScroll: true });
	}, [step.id]);

	const handlers = useRef({ onPrev, onNext, onSkip });
	handlers.current = { onPrev, onNext, onSkip };
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				handlers.current.onSkip();
			} else if (event.key === 'ArrowRight') {
				event.preventDefault();
				handlers.current.onNext();
			} else if (event.key === 'ArrowLeft') {
				event.preventDefault();
				handlers.current.onPrev();
			}
		};
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	}, []);

	const trapFocus = (event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (event.key !== 'Tab' || !cardRef.current) return;
		const focusables = Array.from(
			cardRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
		);
		const first = focusables[0];
		const last = focusables[focusables.length - 1];
		if (!first || !last) return;
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	};

	const spotlight = target ? padRect(target, SPOTLIGHT_PADDING) : null;
	const position = computeCardPosition(spotlight, cardSize, viewport);
	const progress = ((index + 1) / total) * 100;

	return createPortal(
		<div className="fixed inset-0 z-[70]" data-testid="tour-overlay">
			{spotlight ? (
				<div
					aria-hidden="true"
					className="pointer-events-none fixed rounded-lg ring-2 ring-primary/70 ring-offset-2 ring-offset-background transition-all duration-300 ease-out motion-reduce:transition-none"
					style={{
						...spotlight,
						boxShadow: '0 0 0 9999px rgb(15 23 42 / 0.55)',
					}}
				/>
			) : (
				<div
					aria-hidden="true"
					className="fixed inset-0 bg-slate-900/55 animate-in fade-in-0 duration-300"
				/>
			)}

			<div
				ref={cardRef}
				// biome-ignore lint/a11y/useSemanticElements: a native <dialog> needs showModal() and its own top layer; the overlay already handles modality and focus.
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				aria-describedby={bodyId}
				onKeyDown={trapFocus}
				className="fixed w-[min(22rem,calc(100vw-2rem))] rounded-xl border bg-popover text-popover-foreground shadow-2xl transition-[top,left] duration-300 ease-out motion-reduce:transition-none"
				style={{ top: position.top, left: position.left }}
			>
				<div
					key={step.id}
					className="flex flex-col gap-4 p-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300 motion-reduce:animate-none"
				>
					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between gap-2">
							<span className="text-xs font-medium tabular-nums text-muted-foreground">
								Paso {index + 1} de {total}
							</span>
							{tutorialTitle && (
								<span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary-ink/10 px-2 py-0.5 rounded-full border border-primary/20">
									{tutorialTitle}
								</span>
							)}
						</div>
						<div
							aria-hidden="true"
							className="h-1 w-full overflow-hidden rounded-full bg-muted"
						>
							<div
								className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<h2
							id={titleId}
							className="text-base font-semibold leading-snug tracking-tight"
						>
							{step.title}
						</h2>
						<p id={bodyId} className="text-sm leading-relaxed text-muted-foreground">
							{step.body}
						</p>
						{step.tips && step.tips.length > 0 && (
							<ul className="mt-1.5 flex flex-col gap-1.5">
								{step.tips.map((tip) => (
									<li
										key={tip}
										className="flex gap-2 text-sm leading-relaxed text-muted-foreground"
									>
										<span
											aria-hidden="true"
											className="mt-[0.55rem] size-1 shrink-0 rounded-full bg-primary-ink/60"
										/>
										<span>{tip}</span>
									</li>
								))}
							</ul>
						)}
					</div>

					<div className="flex items-center justify-between gap-2 pt-1">
						{isLast ? (
							<span />
						) : (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={onSkip}
								className="-ml-2 px-2 text-muted-foreground"
							>
								Saltar tutorial
							</Button>
						)}
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onPrev}
								disabled={isFirst}
							>
								Anterior
							</Button>
							<Button ref={nextRef} type="button" size="sm" onClick={onNext}>
								{isLast ? 'Finalizar' : 'Siguiente'}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
}
