import S from 'fluent-json-schema'

import { jwtRegex } from '../../../util'
import { BaseSuccessReply, BaseFailReply, base4XXResponse, base200Response } from '../../base'

export type Body = {
  responseToken: string
  from: 'button' | 'qr'
}
export type Querystring = unknown
export type Params = unknown
export type Headers = unknown

export type SuccessReply = BaseSuccessReply & {
  redirectUrl?: string
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
  body: S.object()
    .prop('responseToken', S.string().pattern(jwtRegex))
    .prop('from', S.string().enum(['button', 'qr']))
    .required(['responseToken', 'from']),
  querystring: undefined,
  params: undefined,
  headers: undefined,
  response: {
    200: S.object()
      .prop('redirectUrl', S.string().format('url'))
      .extend(base200Response),
    '4xx': base4XXResponse,
  },
}

export const path = '/api/v1/users/sign-in/submit'
