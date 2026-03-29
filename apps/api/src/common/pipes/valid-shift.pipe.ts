import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { SHIFT, ShiftType } from '@repo/common';

@Injectable()
export class ValidShiftPipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		if (SHIFT[value as keyof typeof SHIFT] === undefined) {
			throw new Error(`Invalid level: ${value}`);
		}
		return value as ShiftType;
	}
}
