import { ApiProperty } from '@nestjs/swagger';
import {
	ArrayMaxSize,
	ArrayMinSize,
	ArrayUnique,
	IsArray,
	IsUUID,
} from 'class-validator';
import { JustifyAttendanceRequestDto } from './justify-attendance.request.dto';

export const BULK_JUSTIFY_MAX_RECORDS = 200;

/** Same `reason`/`notes` as the single justification, applied to many records. */
export class BulkJustifyAttendanceRequestDto extends JustifyAttendanceRequestDto {
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(BULK_JUSTIFY_MAX_RECORDS)
	@ArrayUnique()
	@IsUUID('all', { each: true })
	@ApiProperty({
		description: `Identificadores de los registros a justificar (1 a ${BULK_JUSTIFY_MAX_RECORDS}, sin repetidos)`,
		type: [String],
		example: ['5c4d3e2f-1a2b-3c4d-5e6f-7a8b9c0d1e2f'],
	})
	recordIds!: string[];
}
