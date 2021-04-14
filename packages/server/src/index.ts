import * as path from 'path'
import fastify from 'fastify'
import cors from 'fastify-cors'
import cookie from 'fastify-cookie'
import helmet from 'fastify-helmet'
import auth from 'fastify-auth'
import fastifyStatic from 'fastify-static'
import compress from 'fastify-compress'

import { routes } from '@server/routes'
import { Users } from '@server/entities/Users'
import { databaseManager } from '@server/database'
import { applySocket } from '@server/socket'
import { didPlugin } from './plugins/did'
import { getEnv } from './environment'

declare module 'fastify' {
  interface FastifyInstance {
    env: ReturnType<typeof getEnv>

    unsignCookie(value: string): {
      valid: boolean;
      renew: boolean;
      value: string | null;
    };

    parseCookie(value: string): Record<string, string>
  }

  interface FastifyRequest {
    user?: Users
    wsToken?: string
  }
}

const main = async () => {
  const app = fastify({
    logger: true,
  })

  applySocket(app)

  await databaseManager.createDatabaseConnection(app.log.debug)

  const env = getEnv()

  app.decorateRequest('user', undefined)
  app.decorateRequest('wsToken', undefined)
  app.decorate('env', env)

  app.register(compress)
  app.register(cors)
  // CSP will be handled on the client
  app.register(helmet, { contentSecurityPolicy: false })
  app.register(cookie, { secret: env.sessionSecret })
  app.register(auth)
  app.register(fastifyStatic, {
    root: path.join(__dirname, '..', 'public'),
    wildcard: false,
  })

  app.register(didPlugin, env.did)

  app.register(routes)

  app.get('*', async (_, reply) => {
    return reply.sendFile('index.html')
  })

  app.listen({ port: env.port }).then((address) => {
    app.log.info(`server listening on ${address}`)
  })
}

main()
  .then(() => console.log('WACI Demo instance started'))
  .catch((error) => console.log('WACI Demo instance failed to start', error))
