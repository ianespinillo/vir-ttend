export interface ErrorResponse {
	statusCode: number;
	timeStamp: string;
	path: string;
	method: string;
	message: string | string[];
	error: string;
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
