import 'reflect-metadata';

// Shared
export * from './components/shared/empty-state';
export * from './components/shared/error-state';
export * from './components/shared/loading-spinner';
export * from './components/shared/page-header';
export * from './components/shared/data-table';
export * from './components/shared/forbidden-state';

// Layout
export * from './components/layout';

// Features
export * from './components/features/auth';
export * from './components/features/students';
export * from './components/features/academic';
export * from './components/features/attendance';
export * from './components/features/subjects';
export * from './components/features/schedule';
export * from './components/features/dashboard';
export * from './components/features/alerts';

// Lib
export * from './lib/utils';
export * from './lib/format';

// Shadcn primitives
export * from './ui/alert';
export * from './ui/alert-dialog';
export * from './ui/avatar';
export * from './ui/badge';
export * from './ui/button';
export * from './ui/calendar';
export * from './ui/card';
export * from './ui/chart';
export * from './ui/checkbox';
export * from './ui/command';
export * from './ui/dialog';
export * from './ui/dropdown-menu';
export * from './ui/empty';
export * from './ui/form';
export * from './ui/input';
export * from './ui/label';
export * from './ui/popover';
export * from './ui/radio-group';
export * from './ui/scroll-area';
export * from './ui/select';
export * from './ui/separator';
export * from './ui/sheet';
export * from './ui/sidebar';
export * from './ui/skeleton';
export * from './ui/switch';
export * from './ui/tabs';
export * from './ui/table';
export * from './ui/toast';
export * from './ui/tooltip';

// Hooks
export * from './hooks/use-isomorphic-layout-effect';
export * from './hooks/use-media-query';
export * from './hooks/use-mobile';
export * from './hooks/use-toast';

// Toaster (sonner)
export { Toaster } from 'sonner';

// Lucide
export {
	AlertTriangle,
	BarChart3,
	BookOpen,
	CheckCircle,
	Clock,
	Eye,
	Menu,
	Play,
	RefreshCw,
	Shield,
	Smartphone,
	TrendingDown,
	User,
	Users,
} from 'lucide-react';
