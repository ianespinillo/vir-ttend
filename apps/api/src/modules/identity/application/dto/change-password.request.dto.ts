import {
	IsNotEmpty,
	IsString,
	MaxLength,
	MinLength,
	type ValidationArguments,
	type ValidationOptions,
	ValidatorConstraint,
	type ValidatorConstraintInterface,
	registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'matchConstraint', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
	validate(value: unknown, args: ValidationArguments) {
		const [relatedPropertyName] = args.constraints;
		const relatedValue = (args.object as Record<string, unknown>)[
			relatedPropertyName
		];
		return value === relatedValue;
	}

	defaultMessage(args: ValidationArguments) {
		return `${args.property} must match ${args.constraints[0]}`;
	}
}

export function Match(property: string, validationOptions?: ValidationOptions) {
	return (object: object, propertyName: string) => {
		registerDecorator({
			target: object.constructor,
			propertyName,
			options: validationOptions,
			constraints: [property],
			validator: MatchConstraint,
		});
	};
}

export class ChangePasswordRequestDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	oldPassword!: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	newPassword!: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(20, { message: 'Password must not exceed 20 characters' })
	@Match('newPassword', { message: 'Passwords do not match' })
	confirmNewPassword!: string;
}
