import { type FastifyPluginAsync } from 'fastify';
import { requireAuth } from '../middleware/auth.js';
//------------------------------------------------------------------------------//

export const testRoutes: FastifyPluginAsync = async fastify => {
  fastify.addHook('preHandler', requireAuth);

  fastify.get('/ping', async (_request, reply) => {
    return reply.send({request: 'pong'})
  });
};
