export type AnnouncementTargetType = 'school' | 'course' | 'level';

const LEVEL_TARGET_IDS = ['primary', 'secondary'] as const;
export type LevelTargetId = (typeof LEVEL_TARGET_IDS)[number];

export class AnnouncementTarget {
	private readonly _type: AnnouncementTargetType;
	private readonly _id: string;

	constructor(targetType: AnnouncementTargetType, targetId = '') {
		if (
			targetType !== 'school' &&
			targetType !== 'course' &&
			targetType !== 'level'
		) {
			throw new Error(`Invalid target type: ${targetType}`);
		}
		if (targetType === 'school') {
			this._type = 'school';
			this._id = '';
			return;
		}
		if (targetType === 'level') {
			if (!LEVEL_TARGET_IDS.includes(targetId as LevelTargetId)) {
				throw new Error(`Level target must be 'primary' or 'secondary'`);
			}
			this._type = 'level';
			this._id = targetId;
			return;
		}
		if (!targetId) {
			throw new Error('Course target requires a targetId');
		}
		this._type = 'course';
		this._id = targetId;
	}

	get type(): AnnouncementTargetType {
		return this._type;
	}

	get id(): string {
		return this._id;
	}

	equals(other: AnnouncementTarget): boolean {
		return (
			other instanceof AnnouncementTarget &&
			other.type === this.type &&
			other.id === this.id
		);
	}
}
