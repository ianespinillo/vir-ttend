import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';

@Injectable()
export class ValidRolePipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		if (ROLES[value as keyof typeof ROLES] === undefined) {
			throw new Error(`Invalid role: ${value}`);
		}
		return value as Roles;
	}
}
