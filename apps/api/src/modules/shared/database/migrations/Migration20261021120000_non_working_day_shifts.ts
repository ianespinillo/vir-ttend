import { Migration } from '@mikro-orm/migrations';

/**
 * Optional shift scope of the declared non-working days, keyed by `YYYY-MM-DD`.
 * Existing years get an empty map, which means every day suspends every shift.
 */
export class Migration20261021120000_non_working_day_shifts extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "academic_years" add column "non_working_day_shifts" jsonb not null default '{}';`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "academic_years" drop column "non_working_day_shifts";`,
		);
	}
}
