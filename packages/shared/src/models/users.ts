import S from 'fluent-json-schema'

export type UserView = {
  id: string
  username: string
  updatedAt: string
  createdAt: string
}

export const userView = S.object()
  .prop('id', S.string().format('uuid'))
  .prop('username', S.string())
  .prop('updatedAt', S.string().format('date-time'))
  .prop('createdAt', S.string().format('date-time'))
  .required(['id', 'username', 'updatedAt', 'createdAt'])
