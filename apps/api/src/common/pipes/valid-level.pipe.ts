import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { LEVEL, LevelType } from '@repo/common';

@Injectable()
export class ValidLevelPipe implements PipeTransform {
	transform(value?: string) {
		if (value === undefined || value === null || value === '') {
			return undefined;
		}
		if (LEVEL[value as keyof typeof LEVEL] === undefined) {
			throw new BadRequestException(`El nivel "${value}" no es válido.`);
		}
		return value as LevelType;
	}
}
