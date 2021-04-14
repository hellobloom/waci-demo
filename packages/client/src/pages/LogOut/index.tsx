import { useEffect, useState } from 'react'
import { FC } from 'react'
import { Redirect } from 'react-router-dom'
import { useQueryClient } from 'react-query'

import { sitemap } from 'sitemap'
import { BouncingDots } from 'components/Loading/BouncingDots'
import { useUsersLogOut } from 'query/user'
import { useClearUser } from 'components/UserProvider'
import { Card, CardContent } from 'components/Card'

export const LogOut: FC = () => {
  const [isReady, setIsReady] = useState(false)
  const clearUser = useClearUser()
  const queryClient = useQueryClient()
  const { data } = useUsersLogOut()

  useEffect(() => {
    queryClient.clear()
    clearUser()
    setIsReady(true)
  }, [clearUser, queryClient])

  if (typeof data !== 'undefined' && isReady) return <Redirect to={sitemap.signIn} />

  return (
    <Card>
      <CardContent>
        <BouncingDots />
      </CardContent>
    </Card>
  )
}
