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

// types
export type { InfiniteData } from '@tanstack/react-query';
export type { AxiosResponse } from 'axios';
