import { UnprocessableEntityException } from '@nestjs/common';

export interface BulkJustificationFailure {
	recordId: string;
	reason: string;
}

export const BULK_JUSTIFICATION_NOT_FOUND =
	'Registro de asistencia no encontrado';

/**
 * All-or-nothing rejection: nothing was justified, and `details` names every
 * record that failed validation with its reason (the HTTP filter forwards it).
 */
export function bulkJustificationRejected(
	failures: BulkJustificationFailure[],
): UnprocessableEntityException {
	return new UnprocessableEntityException({
		message: `No se justificó ningún registro: ${failures.length} no se pueden justificar.`,
		error: 'Unprocessable Entity',
		details: failures,
	});
}
