// alerts-count.response.dto.ts
export class AlertsCountResponseDto {
	count!: number;

	constructor(count: number) {
		this.count = count;
	}
}
