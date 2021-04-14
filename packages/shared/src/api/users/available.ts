import S from 'fluent-json-schema'

import { BaseSuccessReply, BaseFailReply, base4XXResponse, base200Response } from '../base'

export type Body = {
  username: string
}
export type Querystring = unknown
export type Params = unknown
export type Headers = unknown

export type SuccessReply = BaseSuccessReply & {
  available: boolean
}

export type FailReply = BaseFailReply

export type Reply = SuccessReply | FailReply

export type RouteInterface = {
  Body: Body
  Querystring: Querystring
  Params: Params
  Headers: Headers
  Reply: Reply
}

export const schema = {
  body: S.object().prop('username', S.string()).required(['username']),
  querystring: undefined,
  params: undefined,
  headers: undefined,
  response: {
    200: S.object().prop('available', S.boolean()).required(['available']).extend(base200Response),
    '4xx': base4XXResponse,
  },
}

export const path = '/api/v1/users/available'
