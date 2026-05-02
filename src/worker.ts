import { routeAgentRequest } from "agents";
import { DesignAgent } from "./agent";
export { DesignAgent };
interface ENV {
  DesignAgent: DurableObjectNamespace;
  OPENAI_API_KEY: string;
}
export default {
  async fetch(request: Request, env: ENV) {
    return (
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
} satisfies ExportedHandler<ENV>;

interface Env {}
