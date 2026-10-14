import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(
	date: Date | string,
	pattern = 'dd/MM/yyyy',
): string {
	return format(new Date(date), pattern, { locale: es });
}

/** A null value means no class was given, so there is no percentage to show. */
export function formatPercent(
	value: number | null,
	fractionDigits = 1,
): string {
	return value === null ? '—' : `${value.toFixed(fractionDigits)}%`;
}

export function formatFullName(firstName: string, lastName?: string): string {
	return `${firstName} ${lastName ?? ''}`.trim();
}

export function formatDateTime(date: Date | string): string {
	return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: es });
}

export function formatRelative(date: Date | string): string {
	return `hace ${formatDistanceToNowStrict(new Date(date), { locale: es })}`;
}

export function formatMonthLabel(
	month: number,
	style: 'short' | 'long' = 'long',
): string {
	const label = format(
		new Date(2026, month - 1, 1),
		style === 'short' ? 'MMM' : 'MMMM',
		{
			locale: es,
		},
	);
	return label.charAt(0).toUpperCase() + label.slice(1);
}
