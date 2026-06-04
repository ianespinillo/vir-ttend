export enum STUDENTSTATUS {
	ACTIVE = 'ACTIVE',
	INACTIVE = 'INACTIVE',
	TRANSFERRED = 'TRANSFERRED',
}

export type StudentStatus = keyof typeof STUDENTSTATUS;
