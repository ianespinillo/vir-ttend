import type { Alert } from './alert.response.type.js';

export interface AlertsListResponse {
	items: Alert[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
