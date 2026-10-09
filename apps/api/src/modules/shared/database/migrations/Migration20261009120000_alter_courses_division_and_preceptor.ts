import { Migration } from '@mikro-orm/migrations';

export class Migration20261009120000_alter_courses_division_and_preceptor extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "courses" alter column "division" type varchar(50) using "division"::text;`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" drop not null;`,
		);
		this.addSql(
			`alter table "courses" alter column "academic_year_id" drop not null;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(
			`alter table "courses" alter column "division" type int using "division"::integer;`,
		);
		this.addSql(
			`alter table "courses" alter column "preceptor_id" set not null;`,
		);
		this.addSql(
			`alter table "courses" alter column "academic_year_id" set not null;`,
		);
	}
}
