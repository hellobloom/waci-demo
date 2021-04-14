import { DIDResolutionResult } from 'did-resolver'
import S from 'fluent-json-schema'

import { BaseSuccessReply, BaseFailReply, base4XXResponse, base200Response } from '../base'

export type Body = {
  did: string
}
export type Querystring = unknown
export type Params = unknown
export type Headers = unknown

export type SuccessReply = BaseSuccessReply & DIDResolutionResult

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
  .prop('did', S.string().pattern(/^did:.*/))
  .required(['did']),
  querystring: undefined,
  params: undefined,
  headers: undefined,
  response: {
    200: S.object()
      .prop('didResolutionMetadata', S.object().additionalProperties(true))
      .prop('didDocument', S.oneOf([S.object().additionalProperties(true), S.null()]))
      .prop('didDocumentMetadata', S.object().additionalProperties(true))
      .required(['didResolutionMetadata', 'didDocument', 'didDocumentMetadata'])
      .extend(base200Response),
    '4xx': base4XXResponse,
  },
}

export const path = '/api/v1/did/resolve'
