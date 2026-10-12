import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert } from 'react-native';
import {
	type WeekdayKey,
	formatShortDate,
	toLocalDateString,
} from '../../lib/date';
import {
	type AttendanceDateRules,
	checkDate,
	describeRejection,
	resolveEarliestDate,
	resolveInitialDate,
	stepDate,
} from './date-nav';
import { attendanceQueries } from './queries';

export interface AttendanceDateNav {
	/** Selected day, `YYYY-MM-DD`. */
	date: string;
	today: string;
	/** Earliest selectable day. */
	earliest: string;
	isToday: boolean;
	/** `Lun 06/10`. */
	label: string;
	canGoPrev: boolean;
	canGoNext: boolean;
	/** Not on today, and today is selectable. */
	canGoToday: boolean;
	goPrev: () => void;
	goNext: () => void;
	goToday: () => void;
	/** Validates and switches to `date` (explains why when it cannot). */
	selectDate: (date: string) => void;
}

interface Options {
	/** Optional `date` route param; ignored when it is not selectable. */
	dateParam?: string;
	/** Weekdays with class (teacher subjects); null for any school day. */
	classDays: ReadonlySet<WeekdayKey> | null;
	/** True while the sheet holds edits that were not saved. */
	hasUnsavedChanges: () => boolean;
	/** Called right after the day changed, so the sheet drops its edits. */
	onDateChanged: () => void;
}

/**
 * Day selection for the attendance sheets: today by default, never a future
 * day, never before the school year start, school days only (and, for a
 * subject, only days with class). Changing the day with unsaved edits asks
 * for confirmation; edits are never dropped silently.
 */
export const useAttendanceDate = ({
	dateParam,
	classDays,
	hasUnsavedChanges,
	onDateChanged,
}: Options): AttendanceDateNav => {
	const today = useMemo(() => toLocalDateString(), []);

	// Cache-first: preloaded for preceptors; falls back to a fixed look-back.
	const { data: activeYear } = useQuery(attendanceQueries.activeAcademicYear());
	const earliest = useMemo(
		() => resolveEarliestDate({ today, yearStart: activeYear?.startDate }),
		[today, activeYear?.startDate],
	);

	const rules = useMemo<AttendanceDateRules>(
		() => ({ today, earliest, classDays }),
		[today, earliest, classDays],
	);

	const [date, setDate] = useState(() => resolveInitialDate(dateParam, rules));

	const previousDate = useMemo(() => stepDate(date, -1, rules), [date, rules]);
	const nextDate = useMemo(() => stepDate(date, 1, rules), [date, rules]);
	const todaySelectable = checkDate(today, rules) === null;

	const switchTo = (next: string): void => {
		if (next === date) return;
		const apply = () => {
			setDate(next);
			onDateChanged();
		};
		if (!hasUnsavedChanges()) {
			apply();
			return;
		}
		Alert.alert(
			'Cambios sin guardar',
			'Tenés cambios sin guardar en esta fecha. Si cambiás de fecha se van a descartar. ¿Continuar?',
			[
				{ text: 'Cancelar', style: 'cancel' },
				{ text: 'Descartar y cambiar', style: 'destructive', onPress: apply },
			],
		);
	};

	const selectDate = (next: string): void => {
		const rejection = checkDate(next, rules);
		if (rejection) {
			Alert.alert('Fecha no disponible', describeRejection(rejection));
			return;
		}
		switchTo(next);
	};

	return {
		date,
		today,
		earliest,
		isToday: date === today,
		label: formatShortDate(date),
		canGoPrev: previousDate !== null,
		canGoNext: nextDate !== null,
		canGoToday: date !== today && todaySelectable,
		goPrev: () => {
			if (previousDate) switchTo(previousDate);
		},
		goNext: () => {
			if (nextDate) switchTo(nextDate);
		},
		goToday: () => switchTo(today),
		selectDate,
	};
};
