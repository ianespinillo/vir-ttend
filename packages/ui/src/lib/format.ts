import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(
	date: Date | string,
	pattern = 'dd/MM/yyyy',
): string {
	return format(new Date(date), pattern, { locale: es });
}

export function formatPercent(value: number, fractionDigits = 1): string {
	return `${value.toFixed(fractionDigits)}%`;
}

export function formatFullName(firstName: string, lastName?: string): string {
	return `${firstName} ${lastName ?? ''}`.trim();
}
