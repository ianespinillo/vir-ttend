import { IsIn, IsOptional, IsString } from 'class-validator';
import { AnnouncementTargetType } from '../../domain/value-objects/announcement-target.value-object';

export class UpdateAnnouncementRequestDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	body?: string;

	@IsOptional()
	@IsIn(['school', 'course', 'level'])
	targetType?: AnnouncementTargetType;

	@IsOptional()
	@IsString()
	targetId?: string;
}
