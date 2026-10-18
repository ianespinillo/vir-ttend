import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { SHIFT, ShiftType } from '@repo/common';

@Injectable()
export class ValidShiftPipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		if (SHIFT[value as keyof typeof SHIFT] === undefined) {
			throw new BadRequestException(`El turno "${value}" no es válido.`);
		}
		return value as ShiftType;
	}
}
