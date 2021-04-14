import * as shared from '@waci-demo/shared'

import * as http from './http'

export const resolve = async (body: shared.api.did.resolve.Body) => http.post<shared.api.did.resolve.SuccessReply>(shared.api.did.resolve.path, {body})
