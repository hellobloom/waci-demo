import { BaseSuccessReply, BaseFailReply, base4XXResponse, base200Response } from '../base'

export type Body = unknown
export type Querystring = unknown
export type Params = unknown
export type Headers = unknown

export type SuccessReply = BaseSuccessReply

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
  body: undefined,
  querystring: undefined,
  params: undefined,
  headers: undefined,
  response: {
    200: base200Response,
    '4xx': base4XXResponse,
  },
}

export const path = '/api/v1/users/log-out'
