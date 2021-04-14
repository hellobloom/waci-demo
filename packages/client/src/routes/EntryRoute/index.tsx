import { ReactNode, FC } from 'react'
import { Route, RouteProps, Redirect } from 'react-router-dom'

import { sitemap } from 'sitemap'
import { useUsersMe } from 'query/user'

type EntryRouteProps = RouteProps & {
  loadingFallback: ReactNode
}

const EntryRoute: FC<EntryRouteProps> = (props) => {
  const { data, isError } = useUsersMe()

  let children: ReactNode

  if (isError) {
    children = props.children
  } else if (!data) {
    children = props.loadingFallback
  } else {
    children = <Redirect to={sitemap.home} />
  }

  return <Route {...props}>{children}</Route>
}

export { EntryRoute }
