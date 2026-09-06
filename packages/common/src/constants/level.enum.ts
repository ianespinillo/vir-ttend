export enum LEVEL {
	PRIMARY = 'PRIMARY',
	SECONDARY = 'SECONDARY',
	DEFAULT = 'DEFAULT',
}

export type LevelType = (typeof LEVEL)[keyof typeof LEVEL];
