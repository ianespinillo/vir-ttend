export interface Mapper<T, K> {
	toOrm(entity: T): K;
	toDomain(entity: K): T;
}
