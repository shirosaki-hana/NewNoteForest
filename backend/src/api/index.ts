import { type FastifyPluginAsync } from 'fastify';
import { authRoutes } from './auth.routes.js';
import { noteRoutes } from './note.routes.js';

export const apiRoutes: FastifyPluginAsync = async fastify => {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(noteRoutes, { prefix: '/notes' });
};

export default apiRoutes;
