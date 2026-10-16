const store = new Map(); // remembers answers by name

export async function cached(key, maxAgeMs, loader) {
  const hit = store.get(key);

  if (hit && Date.now() - hit.time < maxAgeMs) {
    return hit.value; // still fresh, skip the network
  } // end if fresh

  const value = await loader();
  store.set(key, { time: Date.now(), value });
  return value;
} // end cached