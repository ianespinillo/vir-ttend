import {
	IsDate,
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
} from 'class-validator';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class CreateAnnouncementRequestDto {
	@IsString()
	@IsNotEmpty()
	title!: string;

	@IsString()
	@IsNotEmpty()
	body!: string;

	@IsIn(['school', 'course', 'level'])
	targetType!: AnnouncementTargetType;

	@IsOptional()
	@IsString()
	targetId?: string;

	@IsOptional()
	@IsDate()
	publishAt?: Date;
}
