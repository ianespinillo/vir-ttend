import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	THEME_STORAGE_KEY,
	ThemeProvider,
	ThemeToggle,
	themeScript,
	useTheme,
} from './index';

type Listener = (event: { matches: boolean }) => void;

let systemDark = false;
let listeners: Listener[] = [];

const setSystemDark = (value: boolean) => {
	systemDark = value;
	for (const l of listeners) l({ matches: value });
};

beforeEach(() => {
	systemDark = false;
	listeners = [];
	window.localStorage.clear();
	document.documentElement.className = '';
	document.documentElement.style.colorScheme = '';
	vi.stubGlobal(
		'matchMedia',
		vi.fn((query: string) => ({
			get matches() {
				return query.includes('dark') ? systemDark : false;
			},
			media: query,
			addEventListener: (_: string, l: Listener) => listeners.push(l),
			removeEventListener: (_: string, l: Listener) => {
				listeners = listeners.filter((x) => x !== l);
			},
		})),
	);
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

function Probe() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	return (
		<div>
			<span data-testid="theme">{theme}</span>
			<span data-testid="resolved">{resolvedTheme}</span>
			<button type="button" onClick={() => setTheme('dark')}>
				dark
			</button>
			<button type="button" onClick={() => setTheme('light')}>
				light
			</button>
			<button type="button" onClick={() => setTheme('system')}>
				system
			</button>
		</div>
	);
}

const html = () => document.documentElement;

describe('ThemeProvider', () => {
	it('defaults to system and follows a light OS preference', () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme')).toHaveTextContent('system');
		expect(screen.getByTestId('resolved')).toHaveTextContent('light');
		expect(html()).not.toHaveClass('dark');
		expect(html().style.colorScheme).toBe('light');
	});

	it('resolves system to dark when the OS prefers dark', () => {
		systemDark = true;
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('resolved')).toHaveTextContent('dark');
		expect(html()).toHaveClass('dark');
		expect(html().style.colorScheme).toBe('dark');
	});

	it('follows OS changes while on system', () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		act(() => setSystemDark(true));
		expect(html()).toHaveClass('dark');
		act(() => setSystemDark(false));
		expect(html()).not.toHaveClass('dark');
	});

	it('ignores OS changes when an explicit theme is chosen', () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'light' }));
		act(() => setSystemDark(true));
		expect(html()).not.toHaveClass('dark');
	});

	it('applies and persists the chosen theme', () => {
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		fireEvent.click(screen.getByRole('button', { name: 'dark' }));
		expect(html()).toHaveClass('dark');
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
		expect(screen.getByTestId('theme')).toHaveTextContent('dark');

		fireEvent.click(screen.getByRole('button', { name: 'light' }));
		expect(html()).not.toHaveClass('dark');
		expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
	});

	it('restores the stored preference on mount', () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme')).toHaveTextContent('dark');
		expect(html()).toHaveClass('dark');
	});

	it('ignores an invalid stored value', () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme')).toHaveTextContent('system');
	});

	it('tolerates unavailable storage', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		render(
			<ThemeProvider>
				<Probe />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme')).toHaveTextContent('system');
		fireEvent.click(screen.getByRole('button', { name: 'dark' }));
		expect(html()).toHaveClass('dark');
	});
});

describe('ThemeToggle', () => {
	it('offers Claro, Oscuro and Sistema options', () => {
		render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);
		expect(screen.getByRole('button', { name: /tema/i })).toBeInTheDocument();
	});
});

describe('themeScript', () => {
	const run = () => new Function(themeScript)();

	it('sets the dark class from the stored preference', () => {
		window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
		run();
		expect(html()).toHaveClass('dark');
		expect(html().style.colorScheme).toBe('dark');
	});

	it('resolves system from the OS preference', () => {
		systemDark = true;
		run();
		expect(html()).toHaveClass('dark');
	});

	it('keeps light when stored light even if OS is dark', () => {
		systemDark = true;
		window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
		run();
		expect(html()).not.toHaveClass('dark');
		expect(html().style.colorScheme).toBe('light');
	});

	it('does not throw when storage is unavailable', () => {
		vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
			throw new Error('blocked');
		});
		expect(run).not.toThrow();
		expect(html()).not.toHaveClass('dark');
	});
});
