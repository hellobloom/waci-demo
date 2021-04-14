import fp from 'fastify-plugin'
import { FastifyPluginCallback } from 'fastify'
import { Ed25519KeyPair } from '@transmute/did-key-ed25519'
import { KeyLike } from 'jose/types'
import { parseJwk } from 'jose/jwk/parse'
import { resolver as keyResolver } from '@transmute/did-key.js';
import { DIDResolutionResult, DIDResolver, Resolver } from 'did-resolver'

const jsonld = require('jsonld')


type DIDPluginOptions = {
  controller: string
  id: string
  publicKeyBase58: string;
  privateKeyBase58: string;
}

const pluginCallback: FastifyPluginCallback<DIDPluginOptions> = async (fastify, {controller, id, publicKeyBase58, privateKeyBase58}, done) => {

  const keyPair = Ed25519KeyPair.from({
    controller,
    id,
    type: 'Ed25519VerificationKey2018',
    publicKeyBase58,
    privateKeyBase58,
  })

  const resolveKeyDID: DIDResolver = async (did) => {
    const {didDocument, didDocumentMetadata} = await keyResolver.resolve(did)

    return {
      didResolutionMetadata: {},
      didDocument,
      didDocumentMetadata,
    }
  }

  const resolveDID = (did: string): Promise<DIDResolutionResult> => {
    return new Resolver({key: resolveKeyDID}).resolve(did)
  }

  const documentLoader = async (url: string) => {
    if (url.startsWith('did:')) {
      const {didDocument} = await resolveDID(url)

      return {
        contextUrl: null,
        document: didDocument,
        documentUrl: url,
      }
    }

    return jsonld.documentLoaders.node()(url)
  }

  fastify.decorate('documentLoader', documentLoader)
  fastify.decorate('resolveDID', resolveDID)
  fastify.decorate('key', {
    keyPair,
    keyLike: await parseJwk(await keyPair.toJwk(true), 'EdDSA')
  })

  done()
}

export const didPlugin = fp<DIDPluginOptions>(pluginCallback, '3.x')

declare module 'fastify' {
  interface FastifyInstance {
    key: {
      keyPair: Ed25519KeyPair,
      keyLike: KeyLike
    },
    resolveDID: (did: string) => Promise<DIDResolutionResult>
    documentLoader: (url: string) => Promise<any>
  }
}
