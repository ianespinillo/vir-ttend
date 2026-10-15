/** Body of every API error, as sent by the global exception filter. */
export interface ErrorResponse {
	statusCode: number;
	timestamp: string;
	path: string;
	method: string;
	/** User-facing message; validation errors send one message per rule. */
	message: string | string[];
	error: string;
	/** Extra structured data for some errors (e.g. student import row errors). */
	details?: unknown;
}

export interface ApiResponse<T> {
	success: boolean;
	data: T;
	timeStamp: string;
}
export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}
