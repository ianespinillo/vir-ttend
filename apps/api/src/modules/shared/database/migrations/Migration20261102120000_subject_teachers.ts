import { Migration } from '@mikro-orm/migrations';

/**
 * Teachers per subject and workshop commission.
 *
 * - subject_teachers: one row per (subject, commission). commission_number
 *   NULL = the teacher covers the whole subject; 1 | 2 = one workshop
 *   commission. Unique per (subject_id, coalesce(commission_number, 0)).
 * - Existing teachers are copied as whole-subject rows (commission NULL), so
 *   no data is lost, and then subjects.teacher_id / teacher_name are dropped.
 *   MikroORM runs up() and down() in a transaction.
 * - down() restores the columns from the whole-subject row, else from the
 *   lowest commission. A teacher per commission cannot be represented in the
 *   old schema: the other commissions' teachers are lost on rollback.
 */
export class Migration20261102120000_subject_teachers extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "subject_teachers" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "subject_id" uuid not null, "commission_number" smallint null, "teacher_id" varchar(255) null, "teacher_name" varchar(255) null, constraint "subject_teachers_pkey" primary key ("id"), constraint "subject_teachers_commission_number_check" check ("commission_number" is null or "commission_number" in (1, 2)));`,
		);
		this.addSql(
			`alter table "subject_teachers" add constraint "subject_teachers_subject_id_foreign" foreign key ("subject_id") references "subjects" ("id") on update cascade on delete cascade;`,
		);
		this.addSql(
			`create unique index "subject_teachers_subject_id_commission_unique" on "subject_teachers" ("subject_id", coalesce("commission_number", 0));`,
		);
		this.addSql(
			`create index "subject_teachers_teacher_id_index" on "subject_teachers" ("teacher_id");`,
		);

		// An account wins over a plain name (the name is only kept while there is no account).
		this.addSql(
			`insert into "subject_teachers" ("id", "subject_id", "commission_number", "teacher_id", "teacher_name", "created_at", "updated_at") select gen_random_uuid(), "id", null, nullif("teacher_id", ''), case when nullif("teacher_id", '') is null then nullif(btrim("teacher_name"), '') else null end, now(), now() from "subjects" where nullif("teacher_id", '') is not null or nullif(btrim("teacher_name"), '') is not null;`,
		);

		this.addSql(`alter table "subjects" drop column "teacher_id";`);
		this.addSql(`alter table "subjects" drop column "teacher_name";`);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "subjects" add column "teacher_id" varchar(255) null;`,
		);
		this.addSql(
			`alter table "subjects" add column "teacher_name" varchar(255) null;`,
		);
		this.addSql(
			`update "subjects" s set "teacher_id" = t."teacher_id", "teacher_name" = t."teacher_name" from (select distinct on ("subject_id") "subject_id", "teacher_id", "teacher_name" from "subject_teachers" order by "subject_id", coalesce("commission_number", 0)) t where t."subject_id" = s."id";`,
		);

		this.addSql(`drop table if exists "subject_teachers" cascade;`);
	}
}
