import { FastifyInstance } from 'fastify'
import * as shared from '@waci-demo/shared'
import { v4 as uuid } from 'uuid'

import { setWebSocketCookie } from '@server/cookies'

export const applyWebsocketRoutes = (app: FastifyInstance): void => {
  app.get<shared.api.websocket.cookie.RouteInterface>(
    shared.api.websocket.cookie.path,
    {
      schema: shared.api.websocket.cookie.schema,
    },
    async (req, reply) => {
      const token = uuid()
      setWebSocketCookie(reply, token)

      return reply.status(200).send({
        success: true,
        token,
      })
    },
  )
}
