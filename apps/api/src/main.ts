import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LogginInterceptor } from './common/interceptors/loggin.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true, // elimina campos no declarados en el DTO
			forbidNonWhitelisted: true, // lanza error si vienen campos extra
			transform: true, // transforma tipos automáticamente (string → number)
			transformOptions: {
				enableImplicitConversion: true,
			},
		}),
	);
	app.useGlobalFilters(new HttpExceptionFilter());
	app.useGlobalInterceptors(new LogginInterceptor(), new TransformInterceptor());
	await app.listen(process.env.PORT || 3000);
}
bootstrap();
