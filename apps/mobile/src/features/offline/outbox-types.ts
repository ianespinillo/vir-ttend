import type { AttendanceStatus } from '../attendance/types';

export type OutboxItemType = 'daily' | 'subject' | 'workshop';
export type OutboxItemStatus = 'pending' | 'syncing' | 'failed';

export interface OutboxRecord {
	studentId: string;
	status: AttendanceStatus;
}

export interface OutboxError {
	message: string;
	statusCode?: number;
	isPermanent: boolean;
	timestamp: number;
}

export interface BaseOutboxItem {
	/** Unique coalescing key: `daily:${courseId}:${date}`, `subject:${subjectId}:${date}` or `workshop:${commissionId}:${date}` */
	id: string;
	type: OutboxItemType;
	/** YYYY-MM-DD */
	date: string;
	records: OutboxRecord[];
	createdAt: number;
	updatedAt: number;
	status: OutboxItemStatus;
	error?: OutboxError;
	retryCount: number;
	lastAttemptAt?: number;
}

export interface DailyOutboxItem extends BaseOutboxItem {
	type: 'daily';
	courseId: string;
	courseName?: string;
}

export interface SubjectOutboxItem extends BaseOutboxItem {
	type: 'subject';
	subjectId: string;
	courseId: string;
	subjectName?: string;
	courseName?: string;
}

export interface WorkshopOutboxItem extends BaseOutboxItem {
	type: 'workshop';
	commissionId: string;
	/** Display label, e.g. `1° 4° · Comisión 141`. */
	commissionLabel?: string;
}

export type OutboxItem =
	| DailyOutboxItem
	| SubjectOutboxItem
	| WorkshopOutboxItem;

export interface EnqueueDailyInput {
	courseId: string;
	courseName?: string;
	date: string;
	records: OutboxRecord[];
}

export interface EnqueueWorkshopInput {
	commissionId: string;
	commissionLabel?: string;
	date: string;
	records: OutboxRecord[];
}

export interface EnqueueSubjectInput {
	subjectId: string;
	subjectName?: string;
	courseId: string;
	courseName?: string;
	date: string;
	records: OutboxRecord[];
}
