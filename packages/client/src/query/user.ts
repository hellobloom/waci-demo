import { useQuery } from 'react-query'
import * as shared from '@waci-demo/shared'

import { WithoutVariables, WithVariables } from './query'

import { api } from 'api'

export const useUsersMe: WithoutVariables<shared.api.users.me.SuccessReply> = (options) =>
  useQuery({
    ...options,
    queryKey: ['users.me'],
    queryFn: () => api.users.me(),
  })

export const useUsersAvailable: WithVariables<shared.api.users.available.Body, shared.api.users.available.SuccessReply> = (variables, options) =>
  useQuery({
    ...options,
    queryKey: ['users.available', variables],
    queryFn: variables === null ? undefined : () => api.users.available(variables),
    enabled: variables === null ? false : true
  })

export const useUsersSignInAuthenticate: WithVariables<shared.api.users.signIn.authenticate.Body, shared.api.users.signIn.authenticate.SuccessReply> = (variables, options) =>
  useQuery({
    ...options,
    queryKey: ['users.sign-in.authenticate', variables],
    queryFn: variables === null ? undefined : () => api.users.signIn.authenticate(variables),
    enabled: variables === null ? false : true
  })

export const useUsersLogOut: WithoutVariables<shared.api.users.logOut.SuccessReply> = (options) =>
  useQuery({
    ...options,
    queryKey: ['users.logout'],
    queryFn: () => api.users.logOut(),
  })
