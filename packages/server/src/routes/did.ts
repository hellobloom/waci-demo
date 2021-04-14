import { FastifyInstance } from 'fastify'
import * as shared from '@waci-demo/shared'

export const applyDIDRoutes = (app: FastifyInstance): void => {
  app.post<shared.api.did.resolve.RouteInterface>(
    shared.api.did.resolve.path,
    {
      schema: shared.api.did.resolve.schema,
    },
    async (req, reply) => {
      const result = await app.resolveDID(req.body.did)

      return reply.status(200).send({
        success: true,
        ...result
      })
    },
  )
}
