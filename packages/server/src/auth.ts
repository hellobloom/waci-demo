import { FastifyRequest } from 'fastify'
import { FastifyAuthFunction } from 'fastify-auth'

import { Users } from '@server/entities/Users'
import { userCookieKey, webSocketCookieKey } from '@server/cookies'

export const verifyUser: FastifyAuthFunction = async (req, reply) => {
  const signedCookie = req.cookies[userCookieKey]
  if (!signedCookie) throw new Error('User not signed in')

  const { valid, value: userId } = reply.unsignCookie(signedCookie)

  if (!valid) throw new Error('Cookie is invalid')
  if (!userId) throw new Error('User not signed in')

  const user = await Users.getRepo().findOne({ where: { id: userId } })
  if (!user) throw new Error('User does not exist')

  req.user = user
}

export const getUser = (req: FastifyRequest): Users => {
  const { user } = req
  if (typeof user === 'undefined') throw new Error('User not attached to request')

  return user
}

export const verifyWebsocketToken: FastifyAuthFunction = async (req, reply) => {
  const signedCookie = req.cookies[webSocketCookieKey]
  if (!signedCookie) throw new Error('No websocket token')

  const { valid, value: wsToken } = reply.unsignCookie(signedCookie)

  if (!valid) throw new Error('Cookie is invalid')
  if (!wsToken) throw new Error('No websocket token')

  req.wsToken = wsToken
}

export const getWebsocketToken = (req: FastifyRequest): string => {
  const { wsToken } = req
  if (typeof wsToken === 'undefined') throw new Error('Web socket token not attached to request')

  return wsToken
}
