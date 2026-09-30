export default {
  async fetch(request, env) {
    // Static assets are served directly by Workers Assets.
    // Keep the binding fallback for deployments that expose ASSETS,
    // but never throw if the binding is absent.
    if (env?.ASSETS?.fetch) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
