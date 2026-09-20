export interface EntityWithId {
  id?: string;
  _id?: string;
}

const REF_FIELD_MAP: Record<string, string> = {
  workspace: 'workspaceId',
  board: 'boardId',
  list: 'listId',
  parent: 'parentId',
  channel: 'channelId',
  user: 'userId',
  owner: 'ownerId',
  sender: 'senderId',
};

export const isValidId = (id?: string | null): id is string =>
  Boolean(id && id !== 'undefined' && id !== 'null');

export const getEntityId = (entity?: EntityWithId | null): string =>
  entity?.id ?? entity?._id ?? '';

export const resolveRouteId = (
  routeId?: string | null,
  fallback?: string | null
): string | undefined => {
  if (isValidId(routeId)) return routeId;
  if (isValidId(fallback)) return fallback;
  return undefined;
};

export const normalizeEntity = <T extends EntityWithId>(entity: T): T => ({
  ...entity,
  _id: getEntityId(entity),
  id: getEntityId(entity),
});

export const normalizeResponseData = <T>(data: T): T => {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeResponseData(item)) as T;
  }

  if (!data || typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  const source = data as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...source };

  if ('id' in source || '_id' in source) {
    const id = getEntityId(source as EntityWithId);
    if (id) {
      normalized._id = id;
      normalized.id = id;
    }
  }

  for (const [sourceKey, targetKey] of Object.entries(REF_FIELD_MAP)) {
    if (normalized[sourceKey] != null && normalized[targetKey] == null) {
      const refValue = normalized[sourceKey];
      if (typeof refValue === 'string') {
        normalized[targetKey] = refValue;
      } else if (refValue && typeof refValue === 'object') {
        const refId = getEntityId(refValue as EntityWithId);
        if (refId) normalized[targetKey] = refId;
      }
    }
  }

  for (const [key, value] of Object.entries(normalized)) {
    if (value && typeof value === 'object') {
      normalized[key] = normalizeResponseData(value);
    }
  }

  return normalized as T;
};
