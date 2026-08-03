import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get('health')
	@ApiOperation({
		summary: 'Health check raíz de la aplicación',
		description: 'Devuelve el estado operativo de la aplicación.',
	})
	@ApiResponse({
		status: 200,
		description: 'Aplicación operativa. Respuesta: { status: "ok" }',
	})
	getHello() {
		return {
			status: 'ok',
		};
	}
}
