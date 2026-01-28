
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
    const { session, loading, profile } = useAuth();

    if (loading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-blue-600 gap-4">
                <Loader2 className="w-12 h-12 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // Role-Based Access Control
    if (allowedRoles && allowedRoles.length > 0) {
        if (!profile) return <Navigate to="/login" replace />;

        // Check if user has ANY of the allowed roles in ANY of their chapters
        // We look at the 'permission_slug' in the joined profile_chapters table
        // NOTE: Supabase returns snake_case by default (profile_chapters), but our types might say camelCase.
        // We check both to be safe.
        const chapters = (profile as any).profile_chapters || profile.profileChapters || [];
        const userRoles = chapters.map((pc: any) => pc.permission_slug) || [];

        const hasPermission = userRoles.some((slug: string) => allowedRoles.includes(slug));

        console.log('RBAC Check:', {
            user: profile.full_name,
            foundRoles: userRoles,
            requiredRoles: allowedRoles,
            hasAccess: hasPermission
        });

        if (!hasPermission) {
            // Redirect to dashboard if they don't have permission
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <Outlet />;
};
