import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LogginInterceptor } from './common/interceptors/loggin.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { getEnvs } from './modules/shared/config/app.config';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	app.enableCors({
		origin: getEnvs().CORS_ORIGINS,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	});
	app.use(cookieParser());
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

	const swaggerConfig = new DocumentBuilder()
		.setTitle('Vir-ttend API')
		.setDescription(
			'API REST de Vir-ttend, sistema multi-tenant de gestión de asistencia escolar.\n\n' +
				'**Autenticación:** la sesión se maneja con cookies httpOnly. Hacé `POST /auth/login`, luego `POST /auth/select-tenant`, y Swagger envía automáticamente la cookie `access_token` en cada request autenticado.',
		)
		.setVersion(process.env.npm_package_version ?? 'dev')
		.addCookieAuth('access_token', {
			type: 'apiKey',
			in: 'cookie',
			name: 'access_token',
			description:
				'Cookie httpOnly de sesión. Se obtiene al llamar a POST /auth/select-tenant.',
		})
		.addTag('App', 'Endpoints genéricos de la aplicación')
		.addTag('Health', 'Health checks de la API, la base de datos y Redis')
		.addTag('Auth', 'Autenticación y selección de tenant')
		.addTag('Users', 'Gestión de usuarios y roles')
		.addTag('Tenants', 'Gestión de tenants (escuelas)')
		.addTag('Announcements', 'Comunicados institucionales')
		.addTag('Academic Years', 'Años académicos')
		.addTag('Courses', 'Cursos')
		.addTag('Students', 'Estudiantes y matriculación')
		.addTag('Subjects', 'Materias')
		.addTag('Schedule', 'Horarios escolares')
		.addTag('Attendance', 'Registro y consulta de asistencia')
		.addTag('Alerts', 'Alertas de ausencias')
		.addTag('Dashboard', 'Paneles y métricas')
		.addTag('Reports', 'Reportes mensuales y resúmenes')
		.addTag('Export', 'Exportación de reportes a Excel y PDF')
		.build();
	const document = SwaggerModule.createDocument(app, swaggerConfig);
	SwaggerModule.setup('docs', app, document, {
		swaggerOptions: { persistAuthorization: true },
	});

	await app.listen(process.env.PORT || 3000);
}
bootstrap();
