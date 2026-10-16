import { Migration } from '@mikro-orm/migrations';

export class Migration20261016023715 extends Migration {
	override async up(): Promise<void> {
		this.addSql(
			`alter table "courses" alter column "division" type varchar(255) using ("division"::varchar(255));`,
		);
		this.addSql(
			`alter table "subjects" alter column "teacher_id" type varchar(255) using ("teacher_id"::varchar(255));`,
		);
		this.addSql(
			`alter table "subjects" alter column "teacher_id" drop not null;`,
		);
	}

	override async down(): Promise<void> {
		this.addSql(`alter table "subjects" alter column "teacher_id" set not null;`);
		this.addSql(
			`alter table "courses" alter column "division" type varchar(50) using ("division"::varchar(50));`,
		);
	}
}
