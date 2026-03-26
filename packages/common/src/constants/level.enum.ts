export enum LEVEL {
	PRIMARY = 'PRIMARY',
	SECONDARY = 'SEONDARY',
}

export type LevelType = (typeof LEVEL)[keyof typeof LEVEL];
