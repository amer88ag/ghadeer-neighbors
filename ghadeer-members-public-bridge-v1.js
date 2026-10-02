/* Public members bridge: keep sensitive members table private and serve only safe fields. */
(() => {
  const supabase = window.supabase;
  if (!supabase?.createClient) return;
  const originalCreateClient = supabase.createClient.bind(supabase);
  const URL = "https://xewjakfmdfkbhcnxglct.supabase.co";
  const KEY = "sb_publishable__i-E8Gi5hcdfNd7gZXa12Q_-ZPSXPUr";
  supabase.createClient = (...args) => {
    const client = originalCreateClient(...args);
    const originalFrom = client.from.bind(client);
    client.from = (tableName) => {
      if (tableName !== "members") return originalFrom(tableName);
      return {
        select() { return this; },
        order() {
          return client.rpc("get_public_members").then(({ data, error }) => {
            if (error) return { data: null, error };
            let rows = data;
            if (typeof rows === "string") {
              try { rows = JSON.parse(rows); } catch (_) { rows = []; }
            }
            return { data: Array.isArray(rows) ? rows : [], error: null };
          });
        }
      };
    };
    return client;
  };
})();
