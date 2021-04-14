import { FastifyInstance, FastifyPluginCallback } from 'fastify'

import { applyDIDRoutes } from './did'
import { applyUsersRoutes } from './users'
import { applyWebsocketRoutes } from './websocket'

export const routes: FastifyPluginCallback = (app: FastifyInstance, _, done): void => {
  applyDIDRoutes(app)
  applyUsersRoutes(app)
  applyWebsocketRoutes(app)

  done()
}
