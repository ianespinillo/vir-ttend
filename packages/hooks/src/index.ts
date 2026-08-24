'use client';

// providers
export * from './providers/tanstack-provider';

// lib
export * from './lib/axios-client';
export * from './lib/keys';

// auth
export * from './features/auth/use-login';
export * from './features/auth/use-select-tenant';
export * from './features/auth/use-current-user';
export * from './features/auth/use-logout';

// tenants
export * from './features/tenants/use-tenants';

// users
export * from './features/users/use-users';
export * from './features/users/use-change-role';
export * from './features/users/use-deactivate-membership';

// academic
export * from './features/academic/use-academic-years';
export * from './features/academic/use-active-academic-year';
export * from './features/academic/use-create-academic-year';
export * from './features/academic/use-update-academic-year';
export * from './features/academic/use-course';
export * from './features/academic/use-create-course';
export * from './features/academic/use-update-course';
export * from './features/academic/use-delete-course';
export * from './features/academic/use-subjects';
export * from './features/academic/use-create-subject';
export * from './features/academic/use-update-subject';
export * from './features/academic/use-delete-subject';
export * from './features/academic/use-schedule';
export * from './features/academic/use-set-schedule';
export * from './features/academic/use-users-by-role';

// courses
export * from './features/courses/use-courses';
export * from './features/courses/use-my-courses';

// students
export * from './features/students/use-students';
export * from './features/students/use-student';
export * from './features/students/use-search-students';
export * from './features/students/use-create-student';
export * from './features/students/use-update-student';
export * from './features/students/use-delete-student';
export * from './features/students/use-enroll-student';
export * from './features/students/use-transfer-student';

// attendance
export * from './features/attendance/use-daily-attendance';
export * from './features/attendance/use-attendance-metrics';
export * from './features/attendance/use-register-daily-attendance';
export * from './features/attendance/use-bulk-attendance';
export * from './features/attendance/use-justify-attendance';
export * from './features/attendance/use-attendance-history';
export * from './features/attendance/use-teacher-subjects';
export * from './features/attendance/use-subject-attendance';
export * from './features/attendance/use-register-subject-attendance';
export * from './features/attendance/use-bulk-subject-attendance';
export * from './features/attendance/use-copy-attendance';
export * from './features/attendance/use-copy-daily-attendance';
export * from './features/attendance/use-subject-history';

// alerts
export * from './features/alerts/use-alerts';
export * from './features/alerts/use-unseen-alerts';
export * from './features/alerts/use-alerts-count';
export * from './features/alerts/use-alerts-by-student';
export * from './features/alerts/use-mark-alert-seen';

// announcements
export * from './features/announcements/read-state';
export * from './features/announcements/relevant-announcements';
export * from './features/announcements/use-read-announcements';
export * from './features/announcements/use-relevant-announcements';
export * from './features/announcements/use-announcements';
export * from './features/announcements/use-announcements-for-me';
export * from './features/announcements/use-create-announcement';
export * from './features/announcements/use-update-announcement';
export * from './features/announcements/use-publish-announcement';
export * from './features/announcements/use-delete-announcement';

// dashboard
export * from './features/dashboard/use-preceptor-dashboard';
export * from './features/dashboard/use-course-overview';
export * from './features/dashboard/use-dashboard-metrics';

// reports
export * from './features/reports/use-monthly-report';
export * from './features/reports/use-generate-report';
export * from './features/reports/use-course-summary';
export * from './features/reports/use-available-reports';
export * from './features/reports/use-student-report';
export * from './features/reports/use-export-report';

// types re-exports
export type { InfiniteData } from '@tanstack/react-query';
export type { AxiosResponse } from 'axios';
