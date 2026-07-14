import { Module } from '@nestjs/common';
import { AlertTriggeredListener } from './alert-triggered.listener';
import { AttendanceRegisteredListener } from './attendance-registered.listener';

@Module({
	imports: [AttendanceRegisteredListener, AlertTriggeredListener],
})
export class AttendanceEventsModule {}
