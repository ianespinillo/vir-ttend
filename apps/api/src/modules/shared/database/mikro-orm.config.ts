import { defineConfig } from '@mikro-orm/core';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { SqlHighlighter } from '@mikro-orm/sql-highlighter';
import { getEnvs } from '../config/app.config';

export default defineConfig({
	driver: PostgreSqlDriver,
	clientUrl: getEnvs().DATABASE_URL,
	dbName: 'public',
	entities: ['dist/**/*.entity.js'],
	entitiesTs: ['./src/**/*.entity.ts'],
	extensions: [Migrator],
	migrations: {
		tableName: 'mikro_orm_migrations',
		path: './src/modules/shared/database/migrations',
		pathTs: './src/modules/shared/database/migrations',
	},
	metadataProvider: TsMorphMetadataProvider,
	highlighter: new SqlHighlighter(),
	debug: getEnvs().NODE_ENV === 'development',
	allowGlobalContext: true,
});
