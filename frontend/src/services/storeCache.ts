const storeCache = new Map<string, any>();

export function getCachedStore(id: string) {
  return storeCache.get(id);
}

export function setCachedStore(id: string, data: any) {
  storeCache.set(id, data);
}

export function clearStoreCache(id: string) {
  storeCache.delete(id);
}
