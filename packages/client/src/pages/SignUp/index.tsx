import { ChangeEventHandler, FC, ReactNode, useCallback, useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { WACIElement } from "@bloomprotocol/waci-kit-react";
import * as shared from "@waci-demo/shared";
import queryString from "query-string";
import { useDebounce } from "use-debounce";
import clsx from 'clsx'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useUsersAvailable } from "query/user";
import { useWebsocketCookie } from "query/websocket";
import { Card, CardContent, CardHeader, CardHeaderTitle } from "components/Card";
import { BouncingDots } from "components/Loading/BouncingDots";
import { EmptyView } from "components/EmptyView";
import { Button } from "components/Button";
import { resetSocketConnection } from "utils/socket";
import { useSocket } from "utils/hooks";
import { sitemap } from "sitemap";
import { getHost } from "utils/misc";
import { useLocalClient } from "components/LocalClientProvider";
import { Message, MessageBody, MessageHeader } from "components/Message";

type LocalClientSignUpProps = {
  url: string
}

const LocalClientSignUp: FC<LocalClientSignUpProps> = (props) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>()
  const {claim} = useLocalClient()

  return (
    <div className="tw-pt-4">
      <Button
        isLoading={isLoading}
        onClick={() => {
          setIsLoading(true)
          setError(undefined)

          claim(props.url)
            .then(() => {
              setIsLoading(false)
            })
            .catch((e) => {
              setIsLoading(false)
              setError(e instanceof Error ? `${e.message} - ${e.stack}` : 'Something went wrong!')
            })
        }}
      >
        Claim Credential With Local Client
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

type UsernameInputProps = {
  value: string
  onChange: ChangeEventHandler<HTMLInputElement>
  status: 'init' | 'pending' | 'valid' | 'invalid'
}

const UsernameInput: FC<UsernameInputProps> = (props) => {
  let icon: ReactNode | undefined
  let help: ReactNode | undefined

  switch (props.status) {
    case 'valid':
      icon = <FontAwesomeIcon icon={['fas', 'check']} className="tw-text-green-500" />
      help = <div className="help is-success">This username is available</div>
      break;
    case 'invalid':
      icon = <FontAwesomeIcon icon={['fas', 'times']} className="tw-text-red-500" />
      help = <div className="help is-danger">This username is taken</div>
      break;
    case 'pending':
      icon = <FontAwesomeIcon icon={['fas', 'spinner']} className="tw-text-gray-500 tw-animate-spin" />
      break;
    case 'init':
    default:
      break;
  }

  return (
    <div className="field">
      <label className="label tw-sr-only">Username</label>
      <div className={clsx("control", {"has-icons-right": typeof icon !== 'undefined'})}>
        <input
          value={props.value}
          onChange={props.onChange}
          className="input"
          type="text"
          placeholder="Username"
        />
        {icon && (
          <span className="icon is-small is-right">
            {icon}
          </span>
        )}
      </div>
      {help}
    </div>
  )
}

const useSignUpSubmitWebsocket = () => {
  const history = useHistory()

  const socketCallback = useCallback<(data: any) => any>((data) => {
    history.push(sitemap.authenticate(data.authToken))
  }, [history])
  useSocket('notif/sign-up-submit', socketCallback)
}

export const SignUp: FC = () => {
  useSignUpSubmitWebsocket()
  const {data, isError, refetch} = useWebsocketCookie({onSuccess: () => {
    resetSocketConnection()
  }})
  const [username, setUsername] = useState('')
  const [debouncedUsername] = useDebounce(username, 500)
  const [status, setStatus] = useState<'init' | 'pending' | 'valid' | 'invalid'>('init')
  useUsersAvailable(debouncedUsername === '' ? null : {username: debouncedUsername}, {
    onSuccess: (data) => {
      setStatus(() => data.available ? 'valid' : 'invalid')
    }
  })
  useEffect(() => {
    if (debouncedUsername === '' && status !== 'init') {
      setStatus('init')
    }
  }, [debouncedUsername, status])

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
      url:`${getHost()}${shared.api.users.signUp.challengeToken.path}`,
      query: {username: debouncedUsername, token: data.token}
    })

    children = (
      <div className="tw-block tw-w-1/4 tw-min-w-min">
        <UsernameInput
          value={username}
          onChange={(e) => {
            if (status !== 'pending') setStatus('pending')
            setUsername(e.target.value)
          }}
          status={status}
        />
        {status === 'valid' && (
          <div className="tw-flex tw-flex-col tw-justify-center tw-items-center">
            <WACIElement
              data={{version: '1', challengeTokenUrl}}
              qrProps={{height: 256, width: 256}}
              buttonProps={{size: 'lg', type: 'sign-up'}}
            />
            <LocalClientSignUp url={challengeTokenUrl} />
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardHeaderTitle className="is-centered">
          Create Your Account
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
