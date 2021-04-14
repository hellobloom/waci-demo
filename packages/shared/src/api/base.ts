import S from 'fluent-json-schema'

export type BaseSuccessReply = {
  success: true
}

export type BaseFailReply = {
  success: false
  message?: string
}

export const base200Response = S.object()
  .prop('success', S.boolean().enum([true]))
  .required(['success'])

export const base4XXResponse = S.object()
  .prop('success', S.boolean().enum([false]))
  .prop('message', S.string())
  .additionalProperties(true)
