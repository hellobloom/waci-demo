import { FC, ReactNode } from "react";
import { Redirect, useParams } from "react-router-dom";

import { useUsersSignInAuthenticate } from "query/user";
import { Card, CardContent, CardHeader, CardHeaderTitle } from "components/Card";
import { BouncingDots } from "components/Loading/BouncingDots";
import { EmptyView } from "components/EmptyView";
import { Button } from "components/Button";
import { sitemap } from "sitemap";

export const Authenticate: FC = () => {
  const {token} = useParams<{token: string}>()
  const {data, isError, refetch} = useUsersSignInAuthenticate({token})

  let children: ReactNode

  if (isError) {
    children = (
      <EmptyView
        icon={['fas', 'exclamation-triangle']}
        title="Uh Oh!"
        subTitle="Looks like something went wrong."
      >
        <Button
          onClick={() => {
            refetch()
          }}
        >
          Try Again
        </Button>
      </EmptyView>
    )
  } else if (!data) {
    children = <BouncingDots />
  } else {
    children = <Redirect to={sitemap.home} />
  }

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle className="is-centered">
          Signing In
        </CardHeaderTitle>
      </CardHeader>
      <CardContent>
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
