import { Migration } from '@mikro-orm/migrations';

/**
 * One alert per student, academic year and alert type. Concurrent alert
 * evaluations could both pass the "already alerted" check and insert twice, so
 * the database now enforces it.
 *
 * Existing duplicates are removed first, keeping the earliest alert of each
 * group (ties broken by id). The unique index replaces the plain index on the
 * same columns, which it makes redundant.
 */
export class Migration20261014150000_attendance_alerts_unique extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`delete from "attendance_alerts" a using "attendance_alerts" b where a."student_id" = b."student_id" and a."academic_year_id" = b."academic_year_id" and a."alert_type" = b."alert_type" and (a."created_at", a."id") > (b."created_at", b."id");`,
		);
		this.addSql(
			`drop index if exists "attendance_alerts_student_id_academic_year_id_alert_type_index";`,
		);
		this.addSql(
			`create unique index "attendance_alerts_student_year_type_unique" on "attendance_alerts" ("student_id", "academic_year_id", "alert_type");`,
		);
	}

	override async down(): Promise<void> {
		// Deleted duplicates are not restored.
		this.addSql(
			`drop index if exists "attendance_alerts_student_year_type_unique";`,
		);
		this.addSql(
			`create index "attendance_alerts_student_id_academic_year_id_alert_type_index" on "attendance_alerts" ("student_id", "academic_year_id", "alert_type");`,
		);
	}
}
