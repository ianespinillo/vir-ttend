'use client';

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../ui/button';
import { Calendar } from '../../../../ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '../../../../ui/popover';

export interface DatePickerProps {
	selectedDate: string; // YYYY-MM-DD
	onDateChange: (date: string) => void;
	disabled?: boolean;
}

export function AttendanceDatePicker({
	selectedDate,
	onDateChange,
	disabled,
}: DatePickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const dateObj = selectedDate ? parseISO(selectedDate) : new Date();

	const handleSelect = (date: Date | undefined) => {
		if (!date) return;
		const formatted = format(date, 'yyyy-MM-dd');
		onDateChange(formatted);
		setIsOpen(false);
	};

	const isWeekend = (date: Date) => {
		const day = date.getDay();
		return day === 0 || day === 6;
	};

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={cn(
						'w-full sm:w-56 justify-start text-left font-normal bg-background/50 border-input hover:border-primary/50 transition-colors',
						!selectedDate && 'text-muted-foreground',
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
					{selectedDate ? (
						<span className="capitalize">
							{format(dateObj, "EEEE d 'de' MMMM", { locale: es })}
						</span>
					) : (
						<span>Seleccionar fecha</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={dateObj}
					onSelect={handleSelect}
					disabled={isWeekend}
					initialFocus
					locale={es}
				/>
			</PopoverContent>
		</Popover>
	);
}
