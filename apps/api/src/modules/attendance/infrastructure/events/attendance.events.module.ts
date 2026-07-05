import { Module } from '@nestjs/common';
import { AttendanceRegisteredListener } from './attendance-registered.listener';

@Module({
	imports: [AttendanceRegisteredListener],
})
export class AttendanceEventsModule {}
