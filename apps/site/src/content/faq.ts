export interface FaqItem {
	id: string;
	question: string;
	answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
	{
		id: 'que-es',
		question: '¿Qué es Vir-ttend y para qué escuelas está pensado?',
		answer:
			'Vir-ttend es una plataforma de gestión de asistencia escolar y alertas tempranas. Está pensada para escuelas de nivel inicial, primario y secundario, de gestión pública o privada, y simplifica el trabajo diario de directivos, preceptores y docentes.',
	},
	{
		id: 'diaria-vs-materia',
		question: '¿Se puede tomar asistencia diaria y por materia?',
		answer:
			'Sí. La preceptoría puede tomar el pase de lista diario del curso y cada docente puede registrar la asistencia de su materia. Ambos registros conviven en el legajo del estudiante sin duplicar tareas.',
	},
	{
		id: 'justificaciones',
		question: '¿Cómo se gestionan las tardanzas y las justificaciones?',
		answer:
			'Cada inasistencia admite un motivo de justificación y observaciones. Las tardanzas se computan según el reglamento de la escuela, que define cuántos minutos equivalen a media falta o a una falta completa.',
	},
	{
		id: 'alertas',
		question: '¿Cómo detecta la plataforma los casos de riesgo?',
		answer:
			'Vir-ttend calcula el porcentaje de inasistencias sobre los días hábiles del ciclo lectivo y emite alertas cuando un estudiante supera los umbrales de advertencia o críticos que la escuela configura. Así el equipo puede intervenir antes de que el estudiante pierda la regularidad.',
	},
	{
		id: 'offline',
		question: '¿Se puede tomar asistencia sin conexión a internet?',
		answer:
			'Sí. La app móvil guarda los registros en el dispositivo y los sincroniza automáticamente cuando vuelve la conexión. Es útil en aulas o edificios con señal inestable.',
	},
	{
		id: 'dispositivos',
		question: '¿En qué dispositivos funciona?',
		answer:
			'En cualquier navegador moderno, desde computadoras, notebooks o tablets. Además hay una app móvil para Android y iOS, que todavía no está publicada en las tiendas: podés ver el estado en la sección de descargas.',
	},
	{
		id: 'planes',
		question:
			'¿Qué diferencia hay entre el plan Compartido y el Servidor dedicado?',
		answer:
			'En el plan Compartido tu escuela usa nuestra instancia multi-escuela, con la marca Vir-ttend. En el Servidor dedicado tu escuela tiene una instancia propia, con base de datos exclusiva, su identidad visual (escudo y colores) y la leyenda «con vir-ttend». Tiene un costo adicional: consultanos para una propuesta.',
	},
	{
		id: 'app-propia',
		question: '¿Mi escuela puede tener su propia app móvil?',
		answer:
			'Las escuelas con servidor dedicado cuentan con una app móvil propia, con su nombre y su identidad, que se conecta solamente al servidor de esa escuela. Las escuelas del plan Compartido usan la app general de Vir-ttend.',
	},
	{
		id: 'seguridad',
		question: '¿Qué roles existen y cómo se protegen los datos?',
		answer:
			'La plataforma aplica control de acceso por roles. Los docentes acceden solo a los cursos y materias que tienen asignados, los preceptores gestionan las divisiones a su cargo y los directivos tienen la visión completa de la institución. Los datos de cada escuela están separados de los de las demás. Podés leer más en la política de privacidad.',
	},
	{
		id: 'reportes',
		question: '¿Se pueden exportar reportes?',
		answer:
			'Sí. El módulo de reportes consolida la asistencia mensual por división, con presentismo, ausencias justificadas e injustificadas y porcentajes individuales y grupales.',
	},
	{
		id: 'puesta-en-marcha',
		question: '¿Cómo es la puesta en marcha en una escuela nueva?',
		answer:
			'La implementación es asistida: se carga el padrón de estudiantes, docentes y cursos, se configuran los turnos y el calendario académico y se capacita al equipo de preceptoría y a los directivos.',
	},
	{
		id: 'demo',
		question: '¿Puedo probarlo antes de decidir?',
		answer:
			'Sí. La demo corre en tu navegador con datos ficticios de una escuela de ejemplo, sin registro ni datos reales. Podés entrar como directivo, preceptor o docente.',
	},
];
