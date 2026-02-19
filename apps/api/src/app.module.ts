import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getEnvs } from './modules/shared/config/app.config';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [getEnvs],
		}),
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
