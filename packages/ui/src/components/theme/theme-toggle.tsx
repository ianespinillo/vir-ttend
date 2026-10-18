'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../../ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import { useTheme } from './theme-provider';
import { type ThemePreference, isThemePreference } from './theme-script';

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
	{ value: 'light', label: 'Claro', Icon: Sun },
	{ value: 'dark', label: 'Oscuro', Icon: Moon },
	{ value: 'system', label: 'Sistema', Icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const TriggerIcon = resolvedTheme === 'dark' ? Moon : Sun;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon"
					aria-label="Cambiar tema"
					title="Cambiar tema"
					className={cn('h-9 w-9 rounded-full text-muted-foreground', className)}
				>
					<TriggerIcon />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-40">
				<DropdownMenuLabel>Tema</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuRadioGroup
					value={theme}
					onValueChange={(value) => {
						if (isThemePreference(value)) setTheme(value);
					}}
				>
					{OPTIONS.map(({ value, label, Icon }) => (
						<DropdownMenuRadioItem key={value} value={value}>
							<Icon className="mr-2 h-4 w-4" />
							{label}
						</DropdownMenuRadioItem>
					))}
				</DropdownMenuRadioGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
