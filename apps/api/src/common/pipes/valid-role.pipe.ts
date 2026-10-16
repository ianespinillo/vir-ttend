import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	PipeTransform,
} from '@nestjs/common';
import { ROLES, Roles } from '@repo/common';

@Injectable()
export class ValidRolePipe implements PipeTransform {
	transform(value: string, metadata: ArgumentMetadata) {
		if (ROLES[value as keyof typeof ROLES] === undefined) {
			throw new BadRequestException(`El rol "${value}" no es válido.`);
		}
		return value as Roles;
	}
}
