/**
 * Process-local sliding limit. Idle clients are pruned, and turning over
 * identities cannot grow this map indefinitely or evict a live client's quota.
 * Use a verified proxy/gateway for enforcement across multiple instances.
 */
export function createSubmissionLimit(windowMs: number, max: number, maxClients = 10_000) {
  const clients = new Map<string, number[]>();
  let sweepAt = 0;
  return (client: string, now = Date.now()) => {
    const keep = (time: number) => now - time < windowMs;
    // Do not rescan a full map on every new-IP request.
    if (now >= sweepAt) {
      for (const [key, times] of clients) {
        if (!keep(times.at(-1)!)) clients.delete(key);
      }
      sweepAt = now + Math.min(windowMs, 60_000);
    }
    const history = clients.get(client);
    if (!history && clients.size >= maxClients) return false;
    const recent = history?.filter(keep) ?? [];
    if (recent.length >= max) return false;
    recent.push(now);
    clients.set(client, recent);
    return true;
  };
}
