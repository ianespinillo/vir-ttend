'use client';

import { SubjectAttendancePage } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function AttendanceSubjectPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const initialSubjectId = searchParams.get('subjectId') || undefined;
	const initialDate = searchParams.get('date') || undefined;

	const handleUrlChange = (subjectId: string, date: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('subjectId', subjectId);
		params.set('date', date);
		router.replace(`${pathname}?${params.toString()}`);
	};

	return (
		<SubjectAttendancePage
			initialSubjectId={initialSubjectId}
			initialDate={initialDate}
			onUrlChange={handleUrlChange}
		/>
	);
}
