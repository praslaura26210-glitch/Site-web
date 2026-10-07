// Types minimaux du moteur Cloudflare Workers utilisés par worker/index.ts.
declare module 'cloudflare:workers' {
  export class DurableObject<Env = unknown> {
    ctx: {
      storage: {
        sql: {
          exec<T = Record<string, unknown>>(query: string, ...params: unknown[]): { toArray(): T[]; one(): T };
        };
      };
    };
    env: Env;
    constructor(ctx: unknown, env: Env);
  }
}
