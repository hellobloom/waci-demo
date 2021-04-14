import * as shared from '@waci-demo/shared'

import * as http from './http'

export const cookie = async () => http.get<shared.api.websocket.cookie.SuccessReply>(shared.api.websocket.cookie.path)
