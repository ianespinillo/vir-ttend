import { z } from 'zod';
import { ATTENDANCE_STATUS } from '../constants/attendance-status.enum.js';

export const attendanceStatusSchema = z.enum([
	ATTENDANCE_STATUS.PRESENT,
	ATTENDANCE_STATUS.ABSENT,
	ATTENDANCE_STATUS.LATE,
	ATTENDANCE_STATUS.JUSTIFIED,
]);

export const attendanceRecordSchema = z.object({
	studentId: z.string().uuid(),
	status: attendanceStatusSchema,
});

export const registerDailySchema = z.object({
	courseId: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'Formato esperado: YYYY-MM-DD',
	}),
	records: z.array(attendanceRecordSchema),
});

export type AttendanceStatusValue = z.infer<typeof attendanceStatusSchema>;
export type RegisterDailyFormValues = z.infer<typeof registerDailySchema>;
