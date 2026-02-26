interface RefreshTokenProps {
	id: string;
	userId: string;
	token: string;
	tenantId: string;
	expiresAt: Date;
	createdAt: Date;
	revokedAt?: Date;
}
interface CreateRefreshTokenProps {
	userId: string;
	tenantId: string;
	token: string;
	expiresAt: Date;
}

export class RefreshToken {
	private readonly _id: string;
	private readonly _userId: string;
	private readonly _tenantId: string;
	private readonly _token: string;
	private readonly _expiresAt: Date;
	private readonly _createdAt: Date;
	private _revokedAt?: Date;

	constructor(
		id: string,
		userId: string,
		tenantId: string,
		token: string,
		expiresAt: Date,
		createdAt: Date,
		revokedAt?: Date,
	) {
		this._id = id;
		this._userId = userId;
		this._tenantId = tenantId;
		this._token = token;
		this._expiresAt = expiresAt;
		this._createdAt = createdAt;
		this._revokedAt = revokedAt;
	}
	static create({
		expiresAt,
		userId,
		token,
		tenantId,
	}: CreateRefreshTokenProps): RefreshToken {
		return new RefreshToken(
			crypto.randomUUID(),
			userId,
			tenantId,
			token,
			expiresAt,
			new Date(),
		);
	}
	static reconstitute(props: RefreshTokenProps): RefreshToken {
		return new RefreshToken(
			props.id,
			props.userId,
			props.tenantId,
			props.token,
			props.expiresAt,
			props.createdAt,
			props.revokedAt,
		);
	}
	public get id(): string {
		return this._id;
	}

	public get userId(): string {
		return this._userId;
	}
	public get tenantId(): string {
		return this._tenantId;
	}
	public get token(): string {
		return this._token;
	}

	public get expiresAt(): Date {
		return this._expiresAt;
	}

	public get createdAt(): Date {
		return this._createdAt;
	}

	public get revokedAt(): Date | undefined {
		return this._revokedAt;
	}

	public revoke(): void {
		this._revokedAt = new Date();
	}

	public isExpired(): boolean {
		return new Date() > this._expiresAt;
	}
	public isRevoked(): boolean {
		return !!this._revokedAt;
	}
	public isActive(): boolean {
		return !this.isExpired() && !this.isRevoked();
	}
}
