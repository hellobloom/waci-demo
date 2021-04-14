import wretch, {ResponseChain} from 'wretch'

const api = async (includeContentType: boolean, customHeaders = {}) => {
  return wretch().headers({
    credentials: 'same-origin',
    ...(includeContentType ? { 'Content-Type': 'application/json' } : {}),
    ...customHeaders,
  })
}

type Options = {
  body?: Record<string, any>,
  customHeaders?: Record<string, string>,
}

const generic = async <T>(
  method: 'get' | 'delete' | 'post' | 'put' | 'patch',
  endpoint: string,
  {
    body = {},
    customHeaders = {}
  }: Options
) => {
  const controller = new AbortController()

  const wretcher = (await api(method !== 'delete', customHeaders)).signal(controller).url(endpoint)

  let resp: ResponseChain

  switch (method) {
  case 'get':
  case 'delete':
    resp = wretcher[method]()
    break
  case 'post':
  case 'put':
  case 'patch':
    resp = wretcher[method](body)
    break
  default:
    throw Error(`Unsupported method: ${method}`)
  }

  // This makes the fetch request cancelable by calling .cancel()
  const promise = resp.json<T>()
  ;(promise as any)['cancel'] = controller.abort

  return promise
}

export const post = async <T>(endpoint: string, options: Options  = {}) => generic<T>('post', endpoint, options)

export const get = async <T>(endpoint: string, options: Omit<Options, 'body'> = {}) => generic<T>('get', endpoint, options)

export const del = async <T>(endpoint: string, options: Omit<Options, 'body'> = {}) => generic<T>('delete', endpoint, options)

export const put = async <T>(endpoint: string, options: Options = {}) => generic<T>('put', endpoint, options)

export const patch = async <T>(endpoint: string, options: Options = {}) => generic<T>('patch', endpoint, options)
