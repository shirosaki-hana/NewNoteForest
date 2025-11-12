import { type FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { testRoutes } from './test.routes.js';

export const apiRoutes: FastifyPluginAsync = async fastify => {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(testRoutes, { prefix: '/test' });
};

export default apiRoutes;
