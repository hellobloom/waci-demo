import { FC, ReactNode, useCallback, useState } from "react";
import { WACIElement } from "@bloomprotocol/waci-kit-react";
import * as shared from "@waci-demo/shared";
import queryString from 'query-string'

import { useWebsocketCookie } from "query/websocket";
import { Card, CardContent, CardHeader, CardHeaderTitle } from "components/Card";
import { BouncingDots } from "components/Loading/BouncingDots";
import { EmptyView } from "components/EmptyView";
import { Button } from "components/Button";
import { resetSocketConnection } from "utils/socket";
import { useHistory } from "react-router-dom";
import { sitemap } from "sitemap";
import { useSocket } from "utils/hooks";
import { getHost } from "utils/misc";
import { useLocalClient } from "components/LocalClientProvider";
import { Message, MessageBody, MessageHeader } from "components/Message";

type LocalClientSignInProps = {
  url: string
}

const LocalClientSignIn: FC<LocalClientSignInProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const {share} = useLocalClient()

  return (
    <div className="tw-pt-4">
      <Button
        isLoading={isLoading}
        onClick={() => {
          setError(undefined)
          setIsLoading(true)

          share(props.url)
            .then(() => {
              setIsLoading(false)
            })
            .catch((e) => {
              setIsLoading(false)
              setError(e instanceof Error ? `${e.message} - ${e.stack}` : 'Something went wrong!')
            })
        }}
      >
        Share Credential From Local Client
      </Button>
      {error && (
        <Message>
          <MessageHeader>Uh Oh!</MessageHeader>
          <MessageBody>
            {error}
          </MessageBody>
        </Message>
      )}
    </div>
  )
}

const useSignUpSubmitWebsocket = () => {
  const history = useHistory()

  const socketCallback = useCallback<(data: any) => any>((data) => {
    history.push(sitemap.authenticate(data.authToken))
  }, [history])
  useSocket('notif/sign-in-submit', socketCallback)
}

export const SignIn: FC = () => {
  const {data, isError, refetch} = useWebsocketCookie({onSuccess: () => {
    resetSocketConnection()
  }})
  useSignUpSubmitWebsocket()

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
    const challengeTokenUrl = queryString.stringifyUrl({
      url:`${getHost()}${shared.api.users.signIn.challengeToken.path}`,
      query: {token: data.token}
    })

    children = (
      <div className="tw-block tw-w-1/4 tw-min-w-min">
        <div className="tw-flex tw-flex-col tw-justify-center tw-items-center">
          <WACIElement
            data={{version: '1', challengeTokenUrl}}
            qrProps={{height: 256, width: 256}}
            buttonProps={{size: 'lg', type: 'sign-up'}}
          />
          <LocalClientSignIn url={challengeTokenUrl} />
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle className="is-centered">
          Sign Into Your Account
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
