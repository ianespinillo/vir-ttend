import { Migration } from '@mikro-orm/migrations';

export class Migration20261009120100_attendance_alerts_seen_at_timestamptz extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" type timestamptz using ("seen_at"::timestamptz);`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "attendance_alerts" alter column "seen_at" type date using ("seen_at"::date);`,
		);
	}
}
