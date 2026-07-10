export enum LEVEL {
	PRIMARY = 'PRIMARY',
	SECONDARY = 'SEONDARY',
	DEFAULT = 'DEFAULT',
}

export type LevelType = (typeof LEVEL)[keyof typeof LEVEL];
