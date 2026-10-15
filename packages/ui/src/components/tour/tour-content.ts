import { APP_ROUTES, ROLES, type Roles } from '@repo/common';

/**
 * Copy of the onboarding tour. Each navigation entry explains what the page
 * is for and lists the two or three actions a newcomer needs first. A role
 * override replaces the shared copy when the page works differently for it.
 */

export interface TourCopy {
	title?: string;
	body: string;
	tips?: string[];
}

interface NavTourCopy extends TourCopy {
	byRole?: Partial<Record<Roles, TourCopy>>;
}

export const TOUR_WELCOME: Record<Roles, TourCopy> = {
	[ROLES.SUPERADMIN]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como Super Admin gestionás todas las instituciones de la plataforma y sus usuarios. En un minuto te mostramos dónde está cada cosa.',
	},
	[ROLES.ADMIN]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como administrador configurás tu institución —cursos, alumnos, ciclo lectivo y usuarios— y seguís la asistencia de toda la escuela. Te mostramos cómo.',
	},
	[ROLES.PRECEPTOR]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como preceptor tomás la asistencia de tus cursos, seguís las alertas de inasistencia y te comunicás con la comunidad. Te mostramos cómo.',
	},
	[ROLES.TEACHER]: {
		title: 'Te damos la bienvenida a Vir-ttend',
		body:
			'Como docente tomás la asistencia de tus materias en cada clase. Es rápido: te mostramos cómo en un par de pasos.',
	},
};

export const TOUR_TENANT_SWITCHER: TourCopy = {
	title: 'Selector de institución',
	body:
		'Desde acá entrás a cualquier institución para operar como ella, y volvés a la vista global cuando terminás.',
};

export const TOUR_FINISH: TourCopy = {
	title: '¡Listo!',
	body:
		'Ya conocés lo esencial. Si querés repasarlo, tocá este botón para volver a ver el tutorial cuando quieras.',
};

export const TOUR_NAV_COPY: Record<string, NavTourCopy> = {
	[APP_ROUTES.tenants]: {
		body: 'Todas las escuelas que usan la plataforma.',
		tips: [
			'«Crear Institución» da de alta una escuela nueva.',
			'Buscá por nombre, subdominio o email y filtrá por estado.',
			'«Ingresar» te lleva adentro de una institución; un banner te recuerda dónde estás y te deja salir.',
		],
	},
	[APP_ROUTES.dashboard]: {
		body: 'Tu punto de partida de cada día.',
		tips: [
			'Las métricas resumen la asistencia del día.',
			'Cada tarjeta de curso muestra presentes, ausentes, tardanzas y lo que falta cargar; tocala para ir directo a tomar asistencia.',
			'El gráfico de tendencia muestra cómo evoluciona la asistencia.',
		],
		byRole: {
			[ROLES.SUPERADMIN]: {
				body: 'Una vista global de la plataforma.',
				tips: [
					'Indicadores de instituciones activas, inactivas y usuarios.',
					'El gráfico muestra las instituciones nuevas de cada mes.',
					'«Actualizar» trae los datos más recientes.',
				],
			},
		},
	},
	[APP_ROUTES.attendanceSubject]: {
		body: 'Tu pantalla principal: la asistencia de cada clase.',
		tips: [
			'Elegí la materia y la fecha; si ese día no hay clase, te avisamos.',
			'Marcá a cada alumno como presente, ausente o tarde, o usá las acciones rápidas.',
			'Nada se guarda hasta que tocás «Confirmar».',
		],
	},
	[APP_ROUTES.courses]: {
		body: 'Los cursos y divisiones de la institución.',
		tips: [
			'Entrá a un curso para ver sus materias, horario, alumnos y asistencia.',
			'En la pestaña Estudiantes de tus cursos podés «Importar alumnos» desde una planilla: descargás la plantilla, la completás, la validás e importás.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body: 'Los cursos y divisiones del ciclo lectivo.',
				tips: [
					'Filtrá por nivel, turno y año lectivo; «Nuevo Curso» crea una división.',
					'Dentro de cada curso cargás materias, horario y alumnos, o los importás desde una planilla con «Importar alumnos».',
					'En la pestaña Comisiones armás las comisiones de taller a contraturno.',
				],
			},
		},
	},
	[APP_ROUTES.students]: {
		body: 'El padrón de alumnos de la institución.',
		tips: [
			'«Nuevo Estudiante» da de alta un alumno con sus datos y los de su tutor.',
			'Filtrá por curso y por estado: activo, inactivo o transferido.',
			'Abrí el legajo de un alumno para ver su asistencia y el reporte de cada mes.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body: 'El padrón de alumnos de la institución.',
				tips: [
					'«Nuevo Estudiante» da de alta un alumno con sus datos y los de su tutor.',
					'Filtrá por curso y por estado: activo, inactivo o transferido.',
					'Desde el menú de cada fila matriculás, cambiás de curso, registrás un traslado o desactivás.',
				],
			},
		},
	},
	[APP_ROUTES.attendanceDaily]: {
		body: 'La toma de asistencia diaria de cada curso.',
		tips: [
			'Elegí curso y fecha; «Todos presentes» acelera la carga.',
			'Ante una falta, «Justificar» registra el motivo.',
			'Nada se guarda hasta que tocás «Confirmar».',
		],
	},
	[APP_ROUTES.attendanceWorkshop]: {
		body:
			'La asistencia de taller por comisión, para los cursos con taller a contraturno.',
		tips: [
			'Elegí la fecha: cada comisión indica si ese día hay taller.',
			'Cargá la asistencia de la comisión y confirmá.',
			'Si no ves comisiones, todavía no te asignaron como preceptor de taller.',
		],
		byRole: {
			[ROLES.ADMIN]: {
				body:
					'La asistencia de taller por comisión, para los cursos con taller a contraturno.',
				tips: [
					'Elegí la fecha: cada comisión indica si ese día hay taller.',
					'Cargá la asistencia de la comisión y confirmá.',
					'Las comisiones se arman desde la pestaña Comisiones de cada curso.',
				],
			},
		},
	},
	[APP_ROUTES.alerts]: {
		body:
			'Avisos automáticos cuando un alumno se acerca o supera el límite de inasistencias.',
		tips: [
			'Advertencia, Crítico y Excedido indican la gravedad.',
			'Tocá una alerta para abrir el legajo del alumno.',
			'«Marcar como vista» la saca de las pendientes.',
		],
	},
	[APP_ROUTES.reports]: {
		body: 'El reporte mensual de asistencia de cada curso.',
		tips: [
			'Elegí curso y período; el mes en curso se genera al momento.',
			'Vas a ver el promedio, los alumnos en riesgo y la evolución del mes.',
			'Exportá el detalle por alumno a Excel o PDF.',
		],
	},
	[APP_ROUTES.announcements]: {
		body: 'Las circulares para la comunidad escolar.',
		tips: [
			'«Nuevo comunicado»: título, contenido y audiencia (toda la escuela, un nivel o un curso).',
			'Podés programar la publicación para más adelante.',
			'Filtrá por estado y audiencia para encontrar uno.',
		],
	},
	[APP_ROUTES.meAnnouncements]: {
		body: 'Los comunicados dirigidos a vos.',
		tips: [
			'Los que no leíste tienen un punto.',
			'Al abrir un comunicado se marca como leído.',
		],
	},
	[APP_ROUTES.settingsUsers]: {
		body: 'Las personas de tu institución.',
		tips: [
			'«Crear Usuario» suma preceptores, docentes u otros administradores.',
			'Buscá por nombre o email.',
			'Desde cada usuario restablecés su clave, editás sus datos, cambiás el rol o lo desactivás.',
		],
		byRole: {
			[ROLES.SUPERADMIN]: {
				body: 'El directorio global de usuarios de la plataforma.',
				tips: [
					'«Crear Usuario» da de alta a alguien en una institución, con su rol.',
					'Buscá por nombre o email y filtrá por institución.',
					'Desde cada usuario restablecés su clave, editás sus datos, cambiás el rol o lo desactivás.',
				],
			},
		},
	},
	[APP_ROUTES.settingsTenant]: {
		body:
			'Los datos de tu escuela: nombre, contacto y demás información institucional.',
		tips: ['Mantenelos al día: se usan en reportes y comunicaciones.'],
	},
	[APP_ROUTES.settingsAcademic]: {
		body: 'Los años lectivos y las reglas de asistencia.',
		tips: [
			'«Nuevo Año Lectivo» define las fechas de inicio y fin, y cuál está activo.',
			'El umbral máximo de inasistencias y la tolerancia de tardanza definen cuándo se disparan las alertas.',
		],
	},
	[APP_ROUTES.profile]: {
		body: 'Tus datos personales y tu contraseña.',
		tips: [
			'Actualizá tu nombre y tu email.',
			'Cambiá tu contraseña cuando quieras.',
		],
	},
};

export function getNavTourCopy(href: string, role: Roles): TourCopy | null {
	const copy = TOUR_NAV_COPY[href];
	if (!copy) return null;
	return copy.byRole?.[role] ?? copy;
}
