import {
	Controller,
	Get,
	ParseUUIDPipe,
	Post,
	Query,
	Res,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
	ApiBody,
	ApiConsumes,
	ApiCookieAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { JwtPayload, ROLES } from '@repo/common';
import { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import { RolesDecorator } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guard/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guard/roles.guard';
import {
	CommitStudentImportCommand,
	CommitStudentImportHandler,
} from '../../application/commands/import-students/commit-student-import.handler';
import { GetStudentImportTemplateHandler } from '../../application/commands/import-students/get-student-import-template.handler';
import {
	PreviewStudentImportCommand,
	PreviewStudentImportHandler,
} from '../../application/commands/import-students/preview-student-import.handler';
import { StudentImportFile } from '../../application/commands/import-students/student-import-file';
import { STUDENT_IMPORT_MAX_FILE_BYTES } from '../../domain/ports/student-import-file.port.interface';

const XLSX_MIME =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const toImportFile = (
	file: Express.Multer.File | undefined,
): StudentImportFile | undefined =>
	file && {
		buffer: file.buffer,
		originalName: file.originalname,
		mimeType: file.mimetype,
		size: file.size,
	};

const uploadInterceptor = () =>
	FileInterceptor('file', {
		limits: { fileSize: STUDENT_IMPORT_MAX_FILE_BYTES },
	});

const fileBody = {
	schema: {
		type: 'object',
		required: ['file'],
		properties: { file: { type: 'string', format: 'binary' } },
	},
};

// student-import.controller.ts
@ApiTags('Students')
@ApiCookieAuth('access_token')
@Controller('students/import')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentImportController {
	constructor(
		private readonly templateHandler: GetStudentImportTemplateHandler,
		private readonly previewHandler: PreviewStudentImportHandler,
		private readonly commitHandler: CommitStudentImportHandler,
	) {}

	@Get('template')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@ApiOperation({
		summary: 'Descargar la plantilla de importación de alumnos',
		description:
			'Devuelve un archivo .xlsx (plantilla-alumnos.xlsx) con las columnas fijas: Apellido, Nombre, DNI, Fecha de nacimiento, Nombre del tutor, Teléfono del tutor y Email del tutor (opcional). Roles permitidos: admin, preceptor. ' +
			'La respuesta es el archivo binario, sin el envoltorio { success, data, timeStamp }.',
	})
	@ApiResponse({ status: 200, description: 'Archivo .xlsx de la plantilla.' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({ status: 403, description: 'Rol no autorizado' })
	async template(@Res() res: Response) {
		const buffer = await this.templateHandler.execute();
		res.setHeader('Content-Type', XLSX_MIME);
		res.setHeader(
			'Content-Disposition',
			'attachment; filename="plantilla-alumnos.xlsx"',
		);
		res.send(buffer);
	}

	@Post('preview')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@UseInterceptors(uploadInterceptor())
	@ApiConsumes('multipart/form-data')
	@ApiBody(fileBody)
	@ApiOperation({
		summary: 'Previsualizar la importación de alumnos',
		description:
			'Valida el archivo .xlsx (campo "file", máximo 1 MB y 100 alumnos) contra el curso indicado y devuelve cada fila con sus errores. No guarda nada. Roles permitidos: admin, preceptor (solo en sus cursos). ' +
			'URL de ejemplo: POST /students/import/preview?courseId=f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
			'Respuesta: { courseId, totalRows, validRows, invalidRows, rows: [{ rowNumber, data, errors }] }, envuelta en { success, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		type: String,
		description: 'ID del curso al que se importan los alumnos.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({ status: 201, description: 'Resultado de la validación.' })
	@ApiResponse({ status: 400, description: 'Archivo o encabezados inválidos' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'Rol no autorizado o curso a cargo de otro preceptor',
	})
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	async preview(
		@Query('courseId', new ParseUUIDPipe()) courseId: string,
		@UploadedFile() file: Express.Multer.File | undefined,
		@CurrentUser() user: JwtPayload,
	) {
		return this.previewHandler.execute(
			new PreviewStudentImportCommand(user, courseId, toImportFile(file)),
		);
	}

	@Post('commit')
	@RolesDecorator(ROLES.ADMIN, ROLES.PRECEPTOR)
	@UseInterceptors(uploadInterceptor())
	@ApiConsumes('multipart/form-data')
	@ApiBody(fileBody)
	@ApiOperation({
		summary: 'Confirmar la importación de alumnos',
		description:
			'Vuelve a validar el mismo archivo y, si todas las filas son válidas, crea todos los alumnos en una única transacción. Si alguna fila tiene errores no se crea ninguno y se responde 422 con el detalle (mismo formato que la previsualización) en el campo "details". Roles permitidos: admin, preceptor (solo en sus cursos). ' +
			'URL de ejemplo: POST /students/import/commit?courseId=f47ac10b-58cc-4372-a567-0e02b2c3d479. ' +
			'Respuesta exitosa: { created }, envuelta en { success, data, timeStamp }.',
	})
	@ApiQuery({
		name: 'courseId',
		required: true,
		type: String,
		description: 'ID del curso al que se importan los alumnos.',
		example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
	})
	@ApiResponse({ status: 201, description: 'Alumnos creados.' })
	@ApiResponse({ status: 400, description: 'Archivo o encabezados inválidos' })
	@ApiResponse({ status: 401, description: 'No autenticado' })
	@ApiResponse({
		status: 403,
		description: 'Rol no autorizado o curso a cargo de otro preceptor',
	})
	@ApiResponse({ status: 404, description: 'Curso no encontrado' })
	@ApiResponse({
		status: 422,
		description: 'Hay filas con errores; no se importó ningún alumno',
	})
	async commit(
		@Query('courseId', new ParseUUIDPipe()) courseId: string,
		@UploadedFile() file: Express.Multer.File | undefined,
		@CurrentUser() user: JwtPayload,
	) {
		return this.commitHandler.execute(
			new CommitStudentImportCommand(user, courseId, toImportFile(file)),
		);
	}
}
