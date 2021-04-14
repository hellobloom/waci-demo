import { useQuery } from 'react-query'
import * as shared from '@waci-demo/shared'

import { WithoutVariables } from './query'

import { api } from 'api'

export const useWebsocketCookie: WithoutVariables<shared.api.websocket.cookie.SuccessReply> = (options) =>
  useQuery({
    ...options,
    queryKey: ['websocket.cookie'],
    queryFn: () => api.websocket.cookie(),
  })
