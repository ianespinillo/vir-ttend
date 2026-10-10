import { Migration } from '@mikro-orm/migrations';

/**
 * Daily attendance rows have `subject_id IS NULL`. Postgres treats NULLs as
 * distinct in the existing unique constraint
 * ("course_id", "student_id", "subject_id", "date"), so it never rejected
 * duplicate daily rows. A partial unique index enforces one daily row per
 * (course, student, date) and leaves subject rows (non-null subject_id) to the
 * existing constraint.
 *
 * Existing duplicates are removed first, keeping the most recently edited row
 * (ties broken by created_at, then id). A justification attached to a removed
 * row moves to the kept row when that one has none; otherwise it is deleted.
 *
 * Nothing is lost silently: before deleting, the attendance rows to remove and
 * every justification attached to them (as they were, before any move) are
 * copied into `attendance_record_dedup_backup` / `justification_dedup_backup`
 * with a `backed_up_at` timestamp. The backups copy columns only (no keys or
 * indexes) so they never conflict with the live tables.
 */
export class Migration20261010120000_attendance_daily_unique extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create temporary table "tmp_attendance_daily_duplicates" as select "id", "keeper_id" from (select "id", first_value("id") over w as "keeper_id", row_number() over w as "rn" from "attendanceRecord" where "subject_id" is null window w as (partition by "course_id", "student_id", "date" order by "edited_at" desc, "created_at" desc, "id" desc)) ranked where "rn" > 1;`,
		);
		this.addSql(
			`create table if not exists "attendance_record_dedup_backup" (like "attendanceRecord");`,
		);
		this.addSql(
			`create table if not exists "justification_dedup_backup" (like "justification");`,
		);
		this.addSql(
			`alter table "attendance_record_dedup_backup" add column if not exists "backed_up_at" timestamptz not null default now();`,
		);
		this.addSql(
			`alter table "justification_dedup_backup" add column if not exists "backed_up_at" timestamptz not null default now();`,
		);
		this.addSql(
			`insert into "attendance_record_dedup_backup" select r.* from "attendanceRecord" r where r."id" in (select "id" from "tmp_attendance_daily_duplicates");`,
		);
		this.addSql(
			`insert into "justification_dedup_backup" select j.* from "justification" j where j."attendanceRecordId" in (select "id" from "tmp_attendance_daily_duplicates");`,
		);
		this.addSql(
			`update "justification" j set "attendanceRecordId" = pick."keeper_id", "attendance_record_id" = pick."keeper_id" from (select distinct on (d."keeper_id") d."keeper_id", jd."id" as "justification_id" from "tmp_attendance_daily_duplicates" d join "justification" jd on jd."attendanceRecordId" = d."id" where not exists (select 1 from "justification" jk where jk."attendanceRecordId" = d."keeper_id") order by d."keeper_id", jd."created_at" desc, jd."id" desc) pick where j."id" = pick."justification_id";`,
		);
		this.addSql(
			`delete from "justification" where "attendanceRecordId" in (select "id" from "tmp_attendance_daily_duplicates");`,
		);
		this.addSql(
			`delete from "attendanceRecord" where "id" in (select "id" from "tmp_attendance_daily_duplicates");`,
		);
		this.addSql(`drop table "tmp_attendance_daily_duplicates";`);

		this.addSql(
			`create unique index "attendanceRecord_daily_unique" on "attendanceRecord" ("course_id", "student_id", "date") where "subject_id" is null;`,
		);
	}

	override async down(): Promise<void> {
		// The `*_dedup_backup` tables are intentionally kept: they are the only copy
		// of the rows removed by `up()`, and dropping the index does not restore them.
		this.addSql(`drop index if exists "attendanceRecord_daily_unique";`);
	}
}
