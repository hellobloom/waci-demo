import { FC } from "react";

import { Card, CardContent, CardHeader, CardHeaderTitle } from "components/Card";
import { useUser } from "components/UserProvider";

export const Home: FC = () => {
  const user = useUser()

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle className="is-centered">
          Welcome, {user.username}
        </CardHeaderTitle>
      </CardHeader>
      <CardContent>
        You just logged in without a password!
      </CardContent>
    </Card>
  )
}
