import S from 'fluent-json-schema'
import envSchema from 'env-schema'

type UnmappedEnv = {
  PORT: number
  SESSION_SECRET: string
  DATABASE_URL: string
  HOST?: string
  NGROK_HOST?: string
  DID_CONTROLLER: string
  DID_ID: string
  DID_PUBLIC_KEY_BASE_58: string
  DID_PRIVATE_KEY_BASE_58: string
}

export const getEnv = () => {
  const env: UnmappedEnv = envSchema({
    schema: S.object()
      .prop('PORT', S.number().default(3000).required())
      .prop('SESSION_SECRET', S.string().required())
      .prop('DATABASE_URL', S.string().required())
      .prop('HOST', S.string())
      .prop('DID_CONTROLLER', S.string().required())
      .prop('DID_ID', S.string().required())
      .prop('DID_PUBLIC_KEY_BASE_58', S.string().required())
      .prop('DID_PRIVATE_KEY_BASE_58', S.string().required()),
    dotenv: true,
  }) as any

  return {
    port: env.PORT,
    sessionSecret: env.SESSION_SECRET,
    dbUrl: env.DATABASE_URL,
    host: env.NGROK_HOST || env.HOST || `http://localhost:${env.PORT}`,
    did: {
      controller: env.DID_CONTROLLER,
      id: env.DID_ID,
      publicKeyBase58: env.DID_PUBLIC_KEY_BASE_58,
      privateKeyBase58: env.DID_PRIVATE_KEY_BASE_58,
    }
  }
}
