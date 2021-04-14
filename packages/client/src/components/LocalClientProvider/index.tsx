import {createContext, FC, useContext, useEffect} from 'react'
import {createLocalStorageStateHook} from 'use-local-storage-state'
import {buildVPV1Unsigned, VCV1} from '@affinidi/vc-common'
import wretch from 'wretch'
import * as common from '@transmute/did-key-common'
import {KeyPair} from '@transmute/did-key-web-crypto'
import {v4 as uuid} from 'uuid'
import { JsonWebKey, JsonWebSignature } from '@transmute/json-web-signature-2020';
import { buildVPV1 } from '@affinidi/vc-common'

import {SignRequestResponseJWT, SignOfferResponseJWT} from './waciJose'
import { api } from 'api'

const {parseJwk} = require('jose/dist/browser/jwk/parse')
const jsonld = require('jsonld')

const useKeyPairState = createLocalStorageStateHook<common.types.KeyPairJwk>('waci-demo.keyPair')
const useCredentialsState = createLocalStorageStateHook<VCV1[]>('waci-demo.vcs', [])

const fetchChallengeToken = (url: string): Promise<{challengeToken: string}> => {
  return wretch()
    .url(url)
    .get()
    .json()
}

const documentLoader = async (url: string) => {
  if (url.startsWith('did:')) {
    const {didDocument} = await api.did.resolve({did: url})

    return {
      contextUrl: null,
      document: didDocument,
      documentUrl: url,
    }
  }

  return jsonld.documentLoaders.xhr()(url)
}

const useDIDKey = () => {
  const [keyPair, setKeyPair] = useKeyPairState()

  useEffect(() => {
    if (typeof keyPair !== 'undefined') return

    let current = true

    const generate = async () => {
      const result = await KeyPair.generate()
      const jwkKeyPair = result.toJsonWebKeyPair(true)

      if (current) {
        setKeyPair({
          ...jwkKeyPair,
          id: `${jwkKeyPair.controller}${jwkKeyPair.id}`
        })
      }
    }

    generate()

    return () => {
      current = false
    }
  }, [keyPair, setKeyPair])

  return {
    keyPair,
    regenerateKeyPair: async () => {
      const result = await KeyPair.generate()
      const jwkKeyPair = result.toJsonWebKeyPair(true)

      setKeyPair({
        ...jwkKeyPair,
        id: `${jwkKeyPair.controller}${jwkKeyPair.id}`
      })
    }
  }
}

type LocalClientContextProps = {
  did: string
  credentials: VCV1[]
  regenerateDID: () => void
  deleteCredential: (index: number) => void
  share: (url: string) => Promise<void>
  claim: (url: string) => Promise<void>
}

const LocalClientContext = createContext<LocalClientContextProps | undefined>(undefined)

export const LocalClientProvider: FC = (props) => {
  const {keyPair, regenerateKeyPair} = useDIDKey()
  const [credentials, setCredentials] = useCredentialsState()

  return (
    <LocalClientContext.Provider
      value={{
        did: keyPair?.controller || '',
        credentials,
        regenerateDID: async () => {
          await regenerateKeyPair()
          setCredentials([])
        },
        deleteCredential: (index) => {
          setCredentials((prevCreds) => {
            const newCreds = [...prevCreds]
            newCreds.splice(index, 1)

            return newCreds
          })
        },
        share: async (url) => {
          if (!keyPair) throw new Error('Key Pair hasn\'t been generated')
          if (credentials.length <= 0) throw new Error('No credentials in wallet')

          const {challengeToken} = await fetchChallengeToken(url)
          const payload = JSON.parse(atob(challengeToken.split('.')[1]))

          if (!payload.iss) throw new Error('iss must be set in challenge')
          if (!payload.callbackUrl) throw new Error('callbackUrl must be set in challenge')
          if (!payload.presentation_definition) throw new Error('presentation_definition must be set in challenge')
          const presentationDefinition: any = payload.presentation_definition

          const vc = credentials[0]

          const unsignedVP = {
            ...buildVPV1Unsigned({
              id: `urn:uuid:${uuid()}`,
              vcs: [vc],
              type: 'PresentationSubmission',
              context: 'https://identity.foundation/presentation-exchange/submission/v1',
              holder: {
                id: keyPair.controller,
              }
            }),
            presentation_submission: {
              id: uuid(),
              definition_id: presentationDefinition.id,
              descriptor_map: [
                {
                  id: presentationDefinition.input_descriptors[0].id,
                  format: 'ldp_vc',
                  path: '$.verifiableCredential[0]'
                }
              ]
            }
          }

          const vp = await buildVPV1({
            unsigned: unsignedVP as any,
            holder: {
              keyId: keyPair.id,
              did: keyPair.controller,
              privateKey: '',
            },
            getSignSuite: async ({keyId, controller}) =>
              new JsonWebSignature({
                key: await JsonWebKey.from({
                  id: keyId,
                  controller,
                  type: 'JsonWebKey2020',
                  privateKeyJwk: keyPair.privateKeyJwk!,
                  publicKeyJwk: keyPair.privateKeyJwk!,
                }),
              }),
            getProofPurposeOptions: () => ({
              challenge: challengeToken,
              domain: 'https://waci-demo.com'
            }),
            documentLoader,
          })

          const responseToken = await new SignRequestResponseJWT({
            challenge: challengeToken,
            verifiable_presentation: vp,
          })
            .setProtectedHeader({alg: 'ES256', kid: keyPair.id})
            .setExpirationTime('30m')
            .setAudience(payload.iss)
            .setIssuer(keyPair.controller)
            .sign(await parseJwk(keyPair.privateKeyJwk, 'ES256'))

          await wretch()
            .url(payload.callbackUrl)
            .post({responseToken, from: 'qr'})
            .json()
        },
        claim: async (url) => {
          if (!keyPair) throw new Error('Key Pair hasn\'t been generated')

          const {challengeToken} = await fetchChallengeToken(url)
          const payload = JSON.parse(atob(challengeToken.split('.')[1]))

          if (!payload.iss) throw new Error('iss must be set in challenge')
          if (!payload.callbackUrl) throw new Error('callbackUrl must be set in challenge')

          const responseToken = await new SignOfferResponseJWT({
            challenge: challengeToken,
          })
            .setProtectedHeader({alg: 'ES256', kid: keyPair.id})
            .setExpirationTime('30m')
            .setAudience(payload.iss)
            .setIssuer(keyPair.controller)
            .sign(await parseJwk(keyPair.privateKeyJwk, 'ES256'))

          const {verifiable_presentation} = await wretch()
            .url(payload.callbackUrl)
            .post({responseToken, from: 'qr'})
            .json()

          setCredentials((prevCreds) => {
            return [...prevCreds, ...verifiable_presentation.verifiableCredential]
          })
        }
      }}
    >
      {props.children}
    </LocalClientContext.Provider>
  )
}

export const useLocalClient = () => {
  const localClient = useContext(LocalClientContext)
  if (!localClient) throw new Error('Not used within LocalClientProvider.')

  return localClient
}
