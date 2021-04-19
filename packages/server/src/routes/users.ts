import { FastifyInstance } from 'fastify'
import * as shared from '@waci-demo/shared'
import base64url from 'base64url';
import { jwtVerify, JWTVerifyGetKey } from 'jose/jwt/verify';
import { SignJWT } from 'jose/jwt/sign';
import { parseJwk } from 'jose/jwk/parse';
import { JWTPayload } from 'jose/types';
import { v4 as uuid } from 'uuid'
import { buildVCV1, buildVCV1Skeleton, buildVCV1Unsigned, buildVPV1, buildVPV1Unsigned, validateVPV1 } from '@affinidi/vc-common';
import { getVCAccountPersonV1Context, VCAccountPersonV1 } from '@affinidi/vc-data';
import { JsonWebKey, JsonWebSignature as JsonWebSignatureBase, JsonWebSignatureOptions } from '@transmute/json-web-signature-2020';
import { DIDDocument, parse } from 'did-resolver'
import * as ed25519 from '@transmute/did-key-ed25519';
import * as x25519 from '@transmute/did-key-x25519';
import * as bls12381 from '@transmute/did-key-bls12381';
import * as secp256k1 from '@transmute/did-key-secp256k1';
import * as webCrypto from '@transmute/did-key-web-crypto';

import { verifyUser, getUser } from '@server/auth'
import { clearUserCookie, clearWebSocketCookie, setUserCookie } from '@server/cookies'
import { Users } from '@server/entities/Users'
import { sendSocketMessage } from '@server/socket';
import { isTokenUsed, useToken } from '@server/entities/UsedTokens';
import { SignOfferChallengeJWT, offerResponseJwtVerify, SignRequestChallengeJWT, requestResponseJwtVerify } from '@server/waciJose'


class JsonWebSignature extends JsonWebSignatureBase {
  constructor(options?: JsonWebSignatureOptions) {
    super(options)

    this.type = 'JsonWebSignature2020'
  }

  async matchProof({proof}: any) {
    return proof.type === 'https://w3id.org/security#JsonWebSignature2020' || proof.type === 'JsonWebSignature2020';
  }

  async verifySignature({ verifyData, verificationMethod, proof }: any) {
    let { verifier } = this;
    if (!verifier) {
      const key = await JsonWebKey.from(verificationMethod);

      // this suite relies on detached JWS....
      // so we need to make sure thats the signature format we are verifying.
      verifier = key.verifier();
    }
    return verifier.verify({ data: verifyData, signature: proof.jws });
  }
}

export const applyUsersRoutes = (app: FastifyInstance): void => {
  // *************************
  // Utils
  // *************************

  const getPublicJwkForKey = async (did: string, keyId: string, didDoc: DIDDocument) => {
    const idchar: any = did.split('did:key:').pop();
    const encodedType = idchar.substring(0, 4);

    const verificationMethod = didDoc.verificationMethod?.find(({id}) => keyId.includes(id))

    if (typeof verificationMethod === 'undefined') {
      throw new Error('Could not find publicKey for given keyId')
    }

    if (typeof verificationMethod.publicKeyBase58 === 'undefined') {
      throw new Error('Could not find publicKey for given keyId')
    }

    switch (encodedType) {
      case 'z6Mk':
        return ed25519.Ed25519KeyPair.fromFingerprint({fingerprint: idchar}).toJwk()
      case 'z6LS':
        return x25519.X25519KeyPair.fromFingerprint({fingerprint: idchar})
      case 'zUC7':
        return (await bls12381.Bls12381G2KeyPair.fromFingerprint({fingerprint: idchar})).toJsonWebKeyPair().publicKeyJwk
      case 'z3tE':
        return (await bls12381.Bls12381G1KeyPair.fromFingerprint({fingerprint: idchar})).toJsonWebKeyPair().publicKeyJwk
      case 'z5Tc':
        throw new Error('Unsupported encoding type')
      case 'zQ3s':
        return secp256k1.Secp256k1KeyPair.fromFingerprint({fingerprint: idchar}).toJwk()
      case 'zXwp':
      case 'zACH':
      case 'zJss':
        return (await webCrypto.KeyPair.fromFingerprint({fingerprint: idchar})).toJsonWebKeyPair().publicKeyJwk
      default:
        throw new Error('Unsupported encoding type')
    }
  }

  const getResponseTokenKey: JWTVerifyGetKey = async (header, token) => {
    if (typeof token.payload !== 'string') {
      throw new Error('Only string payloads are supported')
    }

    const payload: JWTPayload = JSON.parse(base64url.decode(token.payload))

    if (typeof payload.iss !== 'string') {
      throw new Error('No issuer on the payload')
    }
    if (typeof header.kid !== 'string') {
      throw new Error('No keyId on the header')
    }
    if (typeof header.alg !== 'string') {
      throw new Error('No alg on the header')
    }

    const {didDocument} = await app.resolveDID(payload.iss)

    if (!didDocument) {
      throw new Error('Cannot resolve DID Doc for issuer')
    }

    if (didDocument.id.startsWith('did:key')) {
      return parseJwk(await getPublicJwkForKey(payload.iss, header.kid, didDocument), header.alg)
    } else {
      throw new Error('Unsupported DID Method')
    }
  }

  // *************************
  // Sign Up
  // *************************

  app.get<shared.api.users.signUp.challengeToken.RouteInterface>(
    shared.api.users.signUp.challengeToken.path,
    {
      schema: shared.api.users.signUp.challengeToken.schema,
    },
    async (req, reply) => {
      const challengeToken = await new SignOfferChallengeJWT({
        credential_manifest: {
          id: uuid(),
          issuer: {
            id: app.key.keyPair.controller,
            name: 'Bloom Protocol',
            styles: {
              thumbnail: {
                uri: 'https://bloom.co/favicon.png',
                alt: 'Bloom Logo',
              },
            },
          },
          output_descriptors: [
            {
              id: 'account_output',
              schema: [
                {
                  uri: 'https://schema.affinity-project.org/AccountCredentialPersonV1'
                }
              ],
              display: {
                title: {
                  text: 'WACI Demo Account',
                },
                description: {
                  text: req.query.username,
                  path: ['$.credentialSubject.data.hasAccount.identifier'],
                },
              },
            },
          ],
        },
        callbackUrl: `${app.env.host}${shared.api.users.signUp.submit.path}`,
        username: req.query.username,
        version: '0.1' as any
      })
        .setProtectedHeader({alg: 'EdDSA', kid: app.key.keyPair.id})
        .setSubject(req.query.token)
        .setJti(uuid())
        .setExpirationTime('30m')
        .setIssuer(app.key.keyPair.controller)
        .sign(app.key.keyLike)

      return reply.status(200).send({
        success: true,
        challengeToken
      })
    },
  )

  app.post<shared.api.users.signUp.submit.RouteInterface>(
    shared.api.users.signUp.submit.path,
    {
      schema: shared.api.users.signUp.submit.schema,
    },
    async (req, reply) => {
      const isUsed = await isTokenUsed(req.body.responseToken)

      if (isUsed) {
        return reply.status(400).send({
          success: false,
          message: 'Token has already been used'
        })
      }

      let result

      try {
        result = await offerResponseJwtVerify(
          req.body.responseToken,
          {
            key: getResponseTokenKey,
          },
          {
            key: app.key.keyLike,
            options: {
              issuer: app.key.keyPair.controller
            }
          }
        )

        const {username, sub} = result.challenge.payload

        if (typeof username !== 'string') throw new Error('Username not set')
        if (typeof sub !== 'string') throw new Error('Subject not set')
        if (typeof result.challenge.payload.exp !== 'number') throw new Error('Missing exp')

        await useToken(req.body.responseToken, new Date(result.challenge.payload.exp * 1000))
      } catch {
        return reply.status(401).send({
          success: false,
          message: 'Response token is not valid'
        })
      }

      const {username, credential_manifest, sub: webSocketToken } = result.challenge.payload

      const usersRepo = Users.getRepo()

      if ((await usersRepo.count({where: {username}})) > 0) {
        return reply.status(400).send({
          success: false,
          message: 'Username already exists'
        })
      }

      const user = new Users()
      user.username = username as string
      const {id: userId} = await usersRepo.save(user)

      const credential = await buildVCV1({
        unsigned: buildVCV1Unsigned({
          skeleton: buildVCV1Skeleton({
            context: ['https://w3id.org/security/jws/v1', getVCAccountPersonV1Context()],
            type: 'AccountCredentialPersonV1',
            id: `urn:uuid:${uuid()}`,
            credentialSubject: {
              data: {
                "@type": ["Person", "AccountPersonV1"],
                hasAccount: {
                  "@type": "Account",
                  identifier: username,
                }
              }
            },
            holder: {
              id: result.response.payload.iss!
            }
          }),
          issuanceDate: new Date().toISOString()
        }),
        issuer: {
          did: app.key.keyPair.controller,
          keyId: app.key.keyPair.id,
          privateKey: '',
        },
        getSignSuite: async () => {
          return new JsonWebSignature({
            key: await JsonWebKey.from(app.key.keyPair.toJsonWebKeyPair(true)),
          });
        },
        documentLoader: app.documentLoader,
      })

      const unsignedVP = {
        ...buildVPV1Unsigned({
          id: `urn:uuid:${uuid()}`,
          vcs: [credential],
          holder: {
            id: result.response.payload.iss!
          },
          context: [
            'https://w3id.org/security/jws/v1',
            {
              '@version': 1.1,
              CredentialFulfillment: {
                '@id':
                  'https://identity.foundation/credential-manifest/#credential-fulfillment',
                '@type': '@id',
                '@context': {
                  '@version': 1.1,
                  credential_fulfillment: {
                    '@id':
                      'https://identity.foundation/credential-manifest/#credential-fulfillment',
                    '@type': '@json',
                  },
                },
              },
            }
          ],
          type: 'CredentialFulfillment',
        }),
        credential_fulfillment: {
          id: uuid(),
          manifest_id: (credential_manifest as any).id,
          descriptor_map: [
            {
              id: 'account_output',
              format: 'ldp_vc',
              path: '$.verifiableCredential[0]'
            }
          ],
        },
      }

      const vp = await buildVPV1({
        unsigned: unsignedVP,
        holder: {
          did: app.key.keyPair.controller,
          keyId: app.key.keyPair.id,
          privateKey: '',
        },
        getSignSuite: async () =>
          new JsonWebSignature({
            key: await JsonWebKey.from(app.key.keyPair.toJsonWebKeyPair(true)),
          }),
        documentLoader: app.documentLoader,
        getProofPurposeOptions: () => ({
          challenge: uuid(),
          domain: 'https://waci-demo.com'
        })
      })

      let redirectUrl: string | undefined

      const authToken = await new SignJWT({})
        .setProtectedHeader({alg: 'EdDSA', kid: app.key.keyPair.id})
        .setSubject(userId)
        .setExpirationTime('30m')
        .setIssuer(app.key.keyPair.controller)
        .sign(app.key.keyLike)

      if (req.body.from === 'button') {
        redirectUrl = `${app.env.host}/authenticate/${authToken}`
      } else {
        await sendSocketMessage({
          type: 'notif/sign-up-submit',
          token: webSocketToken!,
          payload: JSON.stringify({authToken})
        })
      }

      return reply.status(200).send({
        success: true,
        verifiable_presentation: vp,
        redirectUrl,
      })
    },
  )

  // *************************
  // Sign In
  // *************************

  app.get<shared.api.users.signIn.challengeToken.RouteInterface>(
    shared.api.users.signIn.challengeToken.path,
    {
      schema: shared.api.users.signIn.challengeToken.schema,
    },
    async (req, reply) => {
      const challengeToken = await new SignRequestChallengeJWT({
        presentation_definition: {
          id: uuid(),
          name: 'Bloom Interoperability Demo',
          purpose: "There's no real purpose. It's all about the demo.",
          input_descriptors: [
            {
              id: 'waci_demo_account',

              // Note: this may be changing, being discussed: https://github.com/decentralized-identity/presentation-exchange/issues/134
              schema: {
                name: 'WACI Demo Account',
                uri: 'https://schema.affinity-project.org/AccountCredentialPersonV1',
                purpose: 'We need your verified account credential',
              },

              constraints: {
                fields: [
                  {
                    path: [`$.type[?(@ == 'AccountCredentialPersonV1')]`],
                    purpose: `We need need your verifiable credential to have the 'AccountCredentialPersonV1' type.`,
                    filter: {
                      type: 'array',
                    },
                  },
                ],
              },
            }
          ],
        },
        callbackUrl: `${app.env.host}${shared.api.users.signIn.submit.path}`,
        version: '1'
      })
        .setProtectedHeader({alg: 'EdDSA', kid: app.key.keyPair.id})
        .setSubject(req.query.token)
        .setJti(uuid())
        .setExpirationTime('30m')
        .setIssuer(app.key.keyPair.controller)
        .sign(app.key.keyLike)

      return reply.status(200).send({
        success: true,
        challengeToken,
      })
    },
  )

  app.post<shared.api.users.signIn.submit.RouteInterface>(
    shared.api.users.signIn.submit.path,
    {
      schema: shared.api.users.signIn.submit.schema,
    },
    async (req, reply) => {
      const isUsed = await isTokenUsed(req.body.responseToken)

      if (isUsed) {
        return reply.status(400).send({
          success: false,
          message: 'Token has already been used'
        })
      }

      let result

      try {
        result = await requestResponseJwtVerify(
          req.body.responseToken,
          {
            key: getResponseTokenKey,
          },
          {
            key: app.key.keyLike,
            options: {
              issuer: app.key.keyPair.controller
            }
          }
        )

        const {sub} = result.challenge.payload

        if (typeof sub !== 'string') throw new Error('Subject not set')
        if (typeof result.challenge.payload.exp !== 'number') throw new Error('Missing exp')

        await useToken(req.body.responseToken, new Date(result.challenge.payload.exp * 1000))
      } catch {
        return reply.status(401).send({
          success: false,
          message: 'Response token is not valid'
        })
      }

      const presentation = result.response.payload['verifiable_presentation']

      const validationResult = await validateVPV1({
        documentLoader: app.documentLoader,
        getVerifySuite: async ({controller, verificationMethod}) => {
          const {didDocument} = await app.resolveDID(controller)

          if (!didDocument) {
            throw new Error('Cannot resolve DID Doc for controller')
          }

          const publicKeyJwk = await getPublicJwkForKey(controller, verificationMethod, didDocument)


          return new JsonWebSignature({
            key: await JsonWebKey.from({
              id: verificationMethod,
              controller,
              type: 'JsonWebKey2020',
              privateKeyJwk: publicKeyJwk,
              publicKeyJwk: publicKeyJwk,
            }),
          });
        },
      })(presentation as any)

      if (validationResult.kind === 'invalid') {
        return reply.status(400).send({
          success: false,
          message: 'Invalid Presentation Submission'
        })
      }

      let userId: string

      try {
        const credential: VCAccountPersonV1 = validationResult.data.verifiableCredential[0] as any
        const issuerDid = parse(credential.issuer)?.did
        const ourDid = parse(app.key.keyPair.controller)?.did
        if (!issuerDid || !ourDid || issuerDid !== ourDid) {
          throw new Error('Not issued by WACI Demo')
        }
        const username = credential.credentialSubject.data.hasAccount.identifier
        const user = await Users.getRepo().findOneOrFail({where: {username}})
        userId = user.id
      } catch {
        return reply.status(400).send({
          success: false,
          message: 'Account credential not found in submission'
        })
      }

      const authToken = await new SignJWT({})
        .setProtectedHeader({alg: 'EdDSA', kid: app.key.keyPair.id})
        .setSubject(userId)
        .setExpirationTime('30m')
        .setIssuer(app.key.keyPair.controller)
        .sign(app.key.keyLike)

      let redirectUrl: string | undefined

      if (req.body.from === 'button') {
        redirectUrl = `${app.env.host}/authenticate/${authToken}`
      } else {
        const {sub: webSocketToken} = result.challenge.payload

        await sendSocketMessage({
          type: 'notif/sign-in-submit',
          token: webSocketToken!,
          payload: JSON.stringify({authToken})
        })
      }

      return reply.status(200).send({
        success: true,
        redirectUrl,
      })
    },
  )

  app.post<shared.api.users.signIn.authenticate.RouteInterface>(
    shared.api.users.signIn.authenticate.path,
    {
      schema: shared.api.users.signIn.authenticate.schema,
    },
    async (req, reply) => {
      const isUsed = await isTokenUsed(req.body.token)

      if (isUsed) {
        return reply.status(400).send({
          success: false,
          message: 'Token has already been used'
        })
      }

      let result
      try {
        result = await jwtVerify(req.body.token, app.key.keyLike, {issuer: app.key.keyPair.controller})
        if (typeof result.payload.exp !== 'number') throw new Error('Expiration not set')
        if (typeof result.payload.sub === 'undefined') throw new Error('Subject not set')

        await useToken(req.body.token, new Date(result.payload.exp * 1000))
      } catch {
        return clearWebSocketCookie(reply).status(400).send({
          success: false,
          message: 'Token is invalid'
        })
      }

      return setUserCookie(reply, result.payload.sub).status(200).send({
        success: true
      })
    },
  )

  // *************************
  // Available
  // *************************

  app.post<shared.api.users.available.RouteInterface>(
    shared.api.users.available.path,
    {
      schema: shared.api.users.available.schema,
    },
    async (req, reply) => {
      const count = await Users.getRepo().count({where: {username: req.body.username}})

      return reply.status(200).send({
        available: count >= 1 ? false : true,
        success: true,
      })
    },
  )

  // *************************
  // Me
  // *************************

  app.get<shared.api.users.me.RouteInterface>(
    shared.api.users.me.path,
    {
      schema: shared.api.users.me.schema,
      preHandler: app.auth([verifyUser]),
    },
    async (req, reply) => {
      const user = getUser(req)

      return reply.status(200).send({
        user: user.toView(),
        success: true,
      })
    },
  )

  // *************************
  // Log Out
  // *************************

  app.get<shared.api.users.logOut.RouteInterface>(
    shared.api.users.logOut.path,
    {
      schema: shared.api.users.logOut.schema,
    },
    async (_, reply) => {
      clearUserCookie(reply)

      return reply.status(200).send({
        success: true
      })
    },
  )
}
