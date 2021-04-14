import S from 'fluent-json-schema'

import { jwtRegex } from '../../../util'
import { BaseSuccessReply, BaseFailReply, base4XXResponse, base200Response } from '../../base'

export type Body = unknown
export type Querystring = {
  username: string
  token: string
}
export type Params = unknown
export type Headers = unknown

export type SuccessReply = BaseSuccessReply & {
  challengeToken: string
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
  body: undefined,
  querystring: S.object()
    .prop('username', S.string())
    .prop('token', S.string().format('uuid'))
    .required(['username', 'token']),
  params: undefined,
  headers: undefined,
  response: {
    200: S.object()
      .prop('challengeToken', S.string().pattern(jwtRegex))
      .required(['challengeToken'])
      .extend(base200Response),
    '4xx': base4XXResponse,
  },
}

export const path = '/api/v1/users/sign-up/challenge-token'
