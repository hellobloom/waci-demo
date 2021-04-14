import { useLayoutEffect, useRef, useEffect } from 'react'
import { resetSocketConnection, socketOn } from './socket'

export const useDocumentTitle = (title: string) => {
  useLayoutEffect(() => {
    const prevTitle = document.title
    document.title = title

    return () => {
      document.title = prevTitle
    }
  }, [title])
}

export const useDocumentTitleSuffix = (titleSuffix?: string) => {
  useDocumentTitle(titleSuffix ? `WACI Demo - ${titleSuffix}` : `WACI Demo`)
}

export const usePrevious = <T>(value: T) => {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref.current
}

export const useSocket = (
  type: string,
  callback: (data: any) => void,
  deps?: ReadonlyArray<any>
) => {
  useEffect(() => {
    const cleanup = socketOn(type, callback)

    return () => {
      cleanup()
    }
  }, [type, callback])
}

export const useResetSocketConnection = (deps?: ReadonlyArray<any>) => {
  useEffect(() => {
    resetSocketConnection()
  }, [])
}
