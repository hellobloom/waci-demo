import { FC, ReactNode } from 'react'
import { Route, RouteProps, Redirect } from 'react-router-dom'

import { sitemap } from 'sitemap'
import { useUsersMe } from 'query/user'
import { useUserContext } from 'components/UserProvider'

type ProtectedRouteProps = RouteProps & {
  loadingFallback: ReactNode
}

export const ProtectedRoute: FC<ProtectedRouteProps> = (props) => {
  useUsersMe({
    onSettled: (data, error) => {
      if (error) {
        setUser(null)
      } else {
        setUser(data?.user)
      }
    }
  })
  const { user, setUser } = useUserContext()

  let children: ReactNode

  if (user === undefined) {
    children = props.loadingFallback
  } else if (user === null) {
    children = <Redirect to={sitemap.signIn} />
  } else {
    children = props.children
  }

  return <Route {...props}>{children}</Route>
}
