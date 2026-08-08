'use client';

import { DailyAttendancePage } from '@repo/ui';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function AttendanceDailyPage() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const initialCourseId = searchParams.get('courseId') || undefined;
	const initialDate = searchParams.get('date') || undefined;

	const handleUrlChange = (courseId: string, date: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('courseId', courseId);
		params.set('date', date);
		router.replace(`${pathname}?${params.toString()}`);
	};

	return (
		<DailyAttendancePage
			initialCourseId={initialCourseId}
			initialDate={initialDate}
			onUrlChange={handleUrlChange}
		/>
	);
}
