import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { LEVEL, LevelType } from '@repo/common';

@Injectable()
export class ValidLevelPipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		if (LEVEL[value as keyof typeof LEVEL] === undefined) {
			throw new Error(`Invalid level: ${value}`);
		}
		return value as LevelType;
	}
}
