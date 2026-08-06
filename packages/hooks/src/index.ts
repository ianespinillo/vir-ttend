'use client';

// providers
export * from './providers/tanstack-provider';

// lib
export * from './lib/axios-client';
export * from './lib/keys';

// features
export * from './features/auth/use-login';
export * from './features/auth/use-select-tenant';
export * from './features/auth/use-current-user';
export * from './features/auth/use-logout';
export * from './features/tenants/use-tenants';
export * from './features/courses/use-courses';
export * from './features/students/use-students';
export * from './features/students/use-student';
export * from './features/students/use-search-students';
export * from './features/students/use-create-student';
export * from './features/students/use-update-student';
export * from './features/students/use-delete-student';
export * from './features/students/use-enroll-student';
export * from './features/students/use-transfer-student';
export * from './features/academic/use-active-academic-year';
export * from './features/academic/use-academic-years';
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

// types
export type { InfiniteData } from '@tanstack/react-query';
export type { AxiosResponse } from 'axios';
