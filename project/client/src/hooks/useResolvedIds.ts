import { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { EntityWithId, getEntityId, isValidId, resolveRouteId } from '../lib/entity';
import { useWorkspaceStore } from '../store/workspaceStore';

interface UseResolvedWorkspaceIdOptions {
  redirectSuffix?: string;
}

export const useResolvedWorkspaceId = (
  options: UseResolvedWorkspaceIdOptions = {}
): string | undefined => {
  const navigate = useNavigate();
  const location = useLocation();
  const { workspaceId: routeId } = useParams<{ workspaceId: string }>();
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const resolvedId = resolveRouteId(
    routeId,
    currentWorkspace ? getEntityId(currentWorkspace) : undefined
  );
  const isWorkspaceRoute = location.pathname.startsWith('/workspace/');

  useEffect(() => {
    if (!isWorkspaceRoute || isValidId(routeId)) return;

    if (resolvedId) {
      const suffix = options.redirectSuffix ?? '';
      navigate(`/workspace/${resolvedId}${suffix}`, { replace: true });
      return;
    }

    navigate('/workspaces', { replace: true });
  }, [isWorkspaceRoute, routeId, resolvedId, navigate, options.redirectSuffix]);

  return isWorkspaceRoute ? resolvedId : undefined;
};

export const useResolvedEntityId = (
  routeId: string | undefined,
  fallback?: EntityWithId | null
): string | undefined => resolveRouteId(routeId, fallback ? getEntityId(fallback) : undefined);
