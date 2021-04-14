import { FastifyReply } from 'fastify'

export const userCookieKey = 'wd_user'
const userCookieKeyMaxAge = 365 * 24 * 60 * 60 * 1000

export const webSocketCookieKey = 'wd_ws'
const webSocketCookieKeyMaxAge = 365 * 24 * 60 * 60 * 1000

const setCookie = (cookieKey: string, maxAge: number) => <T extends FastifyReply>(reply: T, value: string) =>
  reply.setCookie(cookieKey, value, {
    maxAge,
    signed: true,
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: true,
  })

export const setUserCookie = setCookie(userCookieKey, userCookieKeyMaxAge)

export const setWebSocketCookie = setCookie(webSocketCookieKey, webSocketCookieKeyMaxAge)

const clearCookie = (cookieKey: string) => <T extends FastifyReply>(reply: T) => reply.clearCookie(cookieKey)

export const clearUserCookie = clearCookie(userCookieKey)

export const clearWebSocketCookie = clearCookie(userCookieKey)
