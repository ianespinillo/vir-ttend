import type { IStudentImportPreviewResponse } from '@repo/common';
import { Alert, AlertDescription } from '../../../ui/alert';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../../../ui/table';

export interface StudentImportPreviewProps {
	preview: IStudentImportPreviewResponse;
	onConfirm: () => void;
	onPickAnotherFile: () => void;
	isImporting?: boolean;
}

export function StudentImportPreview({
	preview,
	onConfirm,
	onPickAnotherFile,
	isImporting = false,
}: StudentImportPreviewProps) {
	const hasErrors = preview.invalidRows > 0;

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2 text-sm" aria-live="polite">
				<Badge variant="outline">Total: {preview.totalRows}</Badge>
				<Badge variant="outline">Válidas: {preview.validRows}</Badge>
				<Badge variant={hasErrors ? 'destructive' : 'outline'}>
					Con errores: {preview.invalidRows}
				</Badge>
			</div>

			{hasErrors && (
				<Alert variant="destructive">
					<AlertDescription>
						Hay filas con errores y no se importó ningún alumno. Corrija el archivo y
						vuelva a subirlo.
					</AlertDescription>
				</Alert>
			)}

			<div className="max-h-[50vh] overflow-auto rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Fila</TableHead>
							<TableHead>Apellido</TableHead>
							<TableHead>Nombre</TableHead>
							<TableHead>DNI</TableHead>
							<TableHead>Fecha de nacimiento</TableHead>
							<TableHead>Tutor</TableHead>
							<TableHead>Teléfono</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Errores</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{preview.rows.map((row) => {
							const invalid = row.errors.length > 0;
							return (
								<TableRow
									key={row.rowNumber}
									data-invalid={invalid}
									className={invalid ? 'bg-destructive/10' : undefined}
								>
									<TableCell>{row.rowNumber}</TableCell>
									<TableCell>{row.data.lastName}</TableCell>
									<TableCell>{row.data.firstName}</TableCell>
									<TableCell>{row.data.documentNumber}</TableCell>
									<TableCell>{row.data.birthDate}</TableCell>
									<TableCell>{row.data.tutorName}</TableCell>
									<TableCell>{row.data.tutorPhone}</TableCell>
									<TableCell>{row.data.tutorEmail ?? '-'}</TableCell>
									<TableCell>
										{invalid ? (
											<ul className="list-disc pl-4 text-destructive">
												{row.errors.map((error) => (
													<li key={error}>{error}</li>
												))}
											</ul>
										) : (
											'-'
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>

			<div className="flex flex-wrap justify-end gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onPickAnotherFile}
					disabled={isImporting}
				>
					Elegir otro archivo
				</Button>
				<Button
					type="button"
					onClick={onConfirm}
					disabled={hasErrors || isImporting || preview.validRows === 0}
				>
					{isImporting ? 'Importando...' : `Importar ${preview.validRows} alumnos`}
				</Button>
			</div>
		</div>
	);
}
