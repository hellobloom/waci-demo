import { UseQueryOptions, UseQueryResult } from 'react-query'

export type WithVariables<
  TVariables extends Record<string, any>,
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData
> = (
  variables: TVariables | null,
  options?: UseQueryOptions<TQueryFnData, TError, TData>,
) => UseQueryResult<TData, TError>

export type WithoutVariables<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData> = (
  options?: UseQueryOptions<TQueryFnData, TError, TData>,
) => UseQueryResult<TData, TError>
