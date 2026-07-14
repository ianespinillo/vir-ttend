import { Migration } from '@mikro-orm/migrations';

export class Migration20260714043602_create_attendance_alerts extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "attendance_alerts" ("id" uuid not null, "student_id" uuid not null, "course_id" uuid not null, "academic_year_id" uuid not null, "tenant_id" uuid not null, "alert_type" varchar(255) not null, "absence_percent" real not null, "seen_by" uuid not null, "seen_at" date not null, "created_at" timestamptz not null default 1784003746919, constraint "attendance_alerts_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index "attendance_alerts_seen_at_index" on "attendance_alerts" ("seen_at");`,
		);
		this.addSql(
			`create index "attendance_alerts_student_id_academic_year_id_alert_type_index" on "attendance_alerts" ("student_id", "academic_year_id", "alert_type");`,
		);

		this.addSql(
			`create table "attendanceRecord" ("id" uuid not null, "tenant_id" uuid not null, "student_id" uuid not null, "course_id" uuid not null, "subject_id" uuid null, "date" date not null, "status" varchar(255) not null, "edited_by" uuid not null, "edited_at" timestamptz not null, "created_at" timestamptz not null, constraint "attendanceRecord_pkey" primary key ("id"));`,
		);
		this.addSql(
			`create index "attendanceRecord_course_id_date_index" on "attendanceRecord" ("course_id", "date");`,
		);
		this.addSql(
			`alter table "attendanceRecord" add constraint "attendanceRecord_course_id_student_id_subject_id_date_unique" unique ("course_id", "student_id", "subject_id", "date");`,
		);

		this.addSql(
			`create table "justification" ("id" uuid not null, "attendance_record_id" uuid not null, "attendanceRecordId" uuid not null, "reason" text not null, "notes" text null, "created_by" uuid not null, "created_at" timestamptz not null, constraint "justification_pkey" primary key ("id"));`,
		);
		this.addSql(
			`alter table "justification" add constraint "justification_attendanceRecordId_unique" unique ("attendanceRecordId");`,
		);

		this.addSql(
			`alter table "justification" add constraint "justification_attendanceRecordId_foreign" foreign key ("attendanceRecordId") references "attendanceRecord" ("id") on update cascade;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "justification" drop constraint "justification_attendanceRecordId_foreign";`,
		);

		this.addSql(`drop table if exists "attendance_alerts" cascade;`);

		this.addSql(`drop table if exists "attendanceRecord" cascade;`);

		this.addSql(`drop table if exists "justification" cascade;`);
	}
}
