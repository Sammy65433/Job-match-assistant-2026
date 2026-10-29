const store = new Map(); // remembers answers by name

function isEmpty(value) {
  if (Array.isArray(value)) return value.length === 0;
  if (value && Array.isArray(value.jobs)) return value.jobs.length === 0;
  return false;
} // end isEmpty

export async function cached(key, maxAgeMs, loader) {
  const hit = store.get(key);

  if (hit && Date.now() - hit.time < maxAgeMs) {
    return hit.value; // still fresh, skip the network
  } // end if fresh

  const value = await loader();

  if (!isEmpty(value)) {
    store.set(key, { time: Date.now(), value });
  } // end if worth remembering

  return value;
} // end cached

export function invalidateCache(prefix = "") {
  if (!prefix) {
    store.clear();
    return;
  } // end if clear all

  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  } // end for keys
} // end invalidateCache
