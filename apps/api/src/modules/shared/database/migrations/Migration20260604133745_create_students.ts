import { Migration } from '@mikro-orm/migrations';

export class Migration20260604133745_create_students extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`create table "students" ("id" uuid not null default gen_random_uuid(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "tenant_id" varchar(255) not null, "course_id" varchar(255) not null, "first_name" varchar(255) not null, "last_name" varchar(255) not null, "document_number" varchar(255) not null, "birth_date" timestamptz not null, "tutor_name" varchar(255) not null, "tutor_phone" varchar(255) not null, "tutor_email" varchar(255) null, "status" varchar(255) not null, "courseId" uuid not null, constraint "students_pkey" primary key ("id"));`,
		);

		this.addSql(
			`alter table "students" add constraint "students_courseId_foreign" foreign key ("courseId") references "courses" ("id") on update cascade;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`drop table if exists "students" cascade;`);
	}
}
