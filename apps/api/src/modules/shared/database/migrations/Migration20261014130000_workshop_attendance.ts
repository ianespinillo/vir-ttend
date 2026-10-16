import { Migration } from '@mikro-orm/migrations';

/**
 * Workshop attendance (technical schools): one row per commission, student and
 * date. It lives in its own table so the daily/subject attendance queries keep
 * counting exactly what they counted before; workshop rows are weighted
 * explicitly in a later change.
 *
 * Column types mirror "attendanceRecord". Deleting a commission removes its
 * attendance (ON DELETE CASCADE).
 */
export class Migration20261014130000_workshop_attendance extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "workshop_attendance_records" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" uuid not null, "workshop_commission_id" uuid not null, "course_id" uuid not null, "student_id" uuid not null, "date" date not null, "status" varchar(255) not null, "edited_by" uuid not null, "edited_at" timestamptz not null, constraint "workshop_attendance_records_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "workshop_attendance_records" add constraint "workshop_attendance_records_commission_student_date_unique" unique ("workshop_commission_id", "student_id", "date");`,
		);
		this.addSql(
			`alter table "workshop_attendance_records" add constraint "workshop_attendance_records_workshop_commission_id_foreign" foreign key ("workshop_commission_id") references "workshop_commissions" ("id") on update cascade on delete cascade;`,
		);
		this.addSql(
			`create index "workshop_attendance_records_commission_date_index" on "workshop_attendance_records" ("workshop_commission_id", "date");`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "workshop_attendance_records" cascade;`);
	}
}
