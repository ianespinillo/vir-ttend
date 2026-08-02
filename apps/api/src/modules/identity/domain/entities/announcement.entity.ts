import { AnnouncementId } from '../value-objects/announcement-id.value-object';
import {
	AnnouncementTarget,
	AnnouncementTargetType,
} from '../value-objects/announcement-target.value-object';

export type AnnouncementStatus = 'draft' | 'published';

interface CreateProps {
	schoolId: string;
	tenantId: string;
	authorId: string;
	title: string;
	body: string;
	target: AnnouncementTarget;
	publishAt?: Date | null;
}

interface ConstructorProps {
	id: AnnouncementId;
	schoolId: string;
	tenantId: string;
	authorId: string;
	title: string;
	body: string;
	target: AnnouncementTarget;
	status: AnnouncementStatus;
	publishAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface ReconstituteProps {
	id: string;
	schoolId: string;
	tenantId: string;
	authorId: string;
	title: string;
	body: string;
	targetType: AnnouncementTargetType;
	targetId: string;
	status: AnnouncementStatus;
	publishAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export class Announcement {
	private readonly _id: AnnouncementId;
	private readonly _schoolId: string;
	private readonly _tenantId: string;
	private readonly _authorId: string;
	private _title: string;
	private _body: string;
	private _target: AnnouncementTarget;
	private _status: AnnouncementStatus;
	private _publishAt: Date | null;
	private readonly _createdAt: Date;
	private _updatedAt: Date;

	private constructor(props: Readonly<ConstructorProps>) {
		this._id = props.id;
		this._schoolId = props.schoolId;
		this._tenantId = props.tenantId;
		this._authorId = props.authorId;
		this._title = props.title;
		this._body = props.body;
		this._target = props.target;
		this._status = props.status;
		this._publishAt = props.publishAt;
		this._createdAt = props.createdAt;
		this._updatedAt = props.updatedAt;
	}

	static create(props: CreateProps): Announcement {
		const now = new Date();
		const publishAt = props.publishAt ?? null;
		const status: AnnouncementStatus = publishAt === null ? 'published' : 'draft';
		return new Announcement({
			id: AnnouncementId.generate(),
			schoolId: props.schoolId,
			tenantId: props.tenantId,
			authorId: props.authorId,
			title: props.title,
			body: props.body,
			target: props.target,
			status,
			publishAt,
			createdAt: now,
			updatedAt: now,
		});
	}

	static reconstitute(props: ReconstituteProps): Announcement {
		return new Announcement({
			id: new AnnouncementId(props.id),
			schoolId: props.schoolId,
			tenantId: props.tenantId,
			authorId: props.authorId,
			title: props.title,
			body: props.body,
			target: new AnnouncementTarget(props.targetType, props.targetId),
			status: props.status,
			publishAt: props.publishAt,
			createdAt: props.createdAt,
			updatedAt: props.updatedAt,
		});
	}

	get id(): AnnouncementId {
		return this._id;
	}

	get schoolId(): string {
		return this._schoolId;
	}

	get tenantId(): string {
		return this._tenantId;
	}

	get authorId(): string {
		return this._authorId;
	}

	get title(): string {
		return this._title;
	}

	get body(): string {
		return this._body;
	}

	get target(): AnnouncementTarget {
		return this._target;
	}

	get status(): AnnouncementStatus {
		return this._status;
	}

	get publishAt(): Date | null {
		return this._publishAt;
	}

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	isPublished(): boolean {
		return this._status === 'published';
	}

	update(props: {
		title?: string;
		body?: string;
		target?: AnnouncementTarget;
	}): void {
		if (this._status !== 'draft') {
			throw new Error('Only draft announcements can be updated');
		}
		if (props.title !== undefined) this._title = props.title;
		if (props.body !== undefined) this._body = props.body;
		if (props.target !== undefined) this._target = props.target;
		this._updatedAt = new Date();
	}

	publish(): void {
		if (this._status === 'published') return;
		this._status = 'published';
		this._publishAt = new Date();
		this._updatedAt = new Date();
	}
}
