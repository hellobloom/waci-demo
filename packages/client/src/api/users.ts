import * as shared from '@waci-demo/shared'

import * as http from './http'

export const me = async () => http.get<shared.api.users.me.SuccessReply>(shared.api.users.me.path)

export const available = async (body: shared.api.users.available.Body) => http.post<shared.api.users.available.SuccessReply>(shared.api.users.available.path, {body})

export const signUp = {
  challengeToken: async () => http.get<shared.api.users.signUp.challengeToken.SuccessReply>(shared.api.users.signUp.challengeToken.path),
  submit: async (body: shared.api.users.signUp.submit.Body) => http.post<shared.api.users.signUp.submit.SuccessReply>(shared.api.users.signUp.submit.path, {body}),
}

export const signIn = {
  challengeToken: async () => http.get<shared.api.users.signIn.challengeToken.SuccessReply>(shared.api.users.signIn.challengeToken.path),
  submit: async (body: shared.api.users.signUp.submit.Body) => http.post<shared.api.users.signIn.submit.SuccessReply>(shared.api.users.signIn.submit.path, {body}),
  authenticate: async (body: shared.api.users.signIn.authenticate.Body) => http.post<shared.api.users.signIn.authenticate.SuccessReply>(shared.api.users.signIn.authenticate.path, {body}),
}

export const logOut = async () => http.get<shared.api.users.logOut.SuccessReply>(shared.api.users.logOut.path)
