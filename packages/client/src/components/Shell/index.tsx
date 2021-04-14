import { useState, ReactNode, FC, Fragment } from 'react'
import { NavLink, Link } from 'react-router-dom'
import clsx from 'clsx'

import { useDocumentTitleSuffix } from 'utils/hooks'
import { sitemap } from 'sitemap'
import { BlinkingDots } from 'components/Loading/BlinkingDots'
import { BouncingDots } from 'components/Loading/BouncingDots'

import logo from './logo.svg'
import { useLocalClient } from 'components/LocalClientProvider'
import { Card, CardContent, CardFooter, CardFooterItem, CardHeader, CardHeaderTitle } from 'components/Card'
import { JSONEditor } from 'components/JSONEditor'
import { Button } from 'components/Button'

type NavProps = {
  homeLink: string
  startItems: ReactNode
  endItems?: ReactNode
}

const Nav: FC<NavProps> = (props) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="navbar has-shadow is-spaced">
      <div className="container">
        <div className="navbar-brand">
          <Link className="navbar-item" to={props.homeLink}>
            <img src={logo} alt="WACI Demo" className="tw-h-7" />
          </Link>
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={clsx('navbar-burger', 'burger', { 'is-active': isOpen })}
            role="button"
            aria-expanded={isOpen ? 'true' : 'false'}
          >
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
          </div>
        </div>

        <div className={clsx('navbar-menu', { 'is-active': isOpen })}>
          <div className="navbar-start">{props.startItems}</div>
          <div className="navbar-end">{props.endItems}</div>
        </div>
      </div>
    </nav>
  )
}

const LocalClientInfo: FC = () => {
  const {credentials, did, regenerateDID} = useLocalClient()

  return (
    <div className="container tw-pt-10">
      <Card>
        <CardHeader>
          <CardHeaderTitle className="is-centered">
            Local Client Info
          </CardHeaderTitle>
        </CardHeader>
        <CardContent>
          <div className="block">
            <div>DID:</div>
            <div>{did}</div>
          </div>
          <div className="block">
            <div>Credentials:</div>
            <JSONEditor value={credentials} />
          </div>
        </CardContent>
        <CardFooter>
          <CardFooterItem>
            <Button onClick={() => regenerateDID()}>
              Reset Client
            </Button>
          </CardFooterItem>
        </CardFooter>
      </Card>
    </div>
  )
}

const Body: FC = (props) => (
  <>
    <main className="tw-px-3 lg:tw-px-8">
      <div className="container">
        <div className="tw-py-4 lg:tw-py-12">{props.children}</div>
      </div>
    </main>
    <LocalClientInfo />
  </>
)

type BaseShellProps = {
  titleSuffix?: string
}

type SignedInUserShellProps = BaseShellProps

const SignedInUserShell: FC<SignedInUserShellProps> = (props) => {
  useDocumentTitleSuffix(props.titleSuffix)

  return (
    <Fragment>
      <Nav
        homeLink={sitemap.home}
        startItems={
          <>
          </>
        }
        endItems={
          <NavLink className="navbar-item" exact activeClassName="is-active" to={sitemap.logOut}>
            Log Out
          </NavLink>
        }
      />
      <Body>{props.children}</Body>
    </Fragment>
  )
}

type SignedOutUserShellProps = BaseShellProps

const SignedOutUserShell: FC<SignedOutUserShellProps> = (props) => {
  useDocumentTitleSuffix(props.titleSuffix)

  return (
    <Fragment>
      <Nav
        homeLink={sitemap.home}
        startItems={
          <Fragment>
            <NavLink className="navbar-item" exact activeClassName="is-active" to={sitemap.signIn}>
              Sign In
            </NavLink>
            <NavLink className="navbar-item" exact activeClassName="is-active" to={sitemap.signUp}>
              Sign Up
            </NavLink>
          </Fragment>
        }
        endItems={
          <NavLink className="navbar-item" exact activeClassName="is-active" to={sitemap.logOut}>
            Log Out
          </NavLink>
        }
      />
      <Body>{props.children}</Body>
    </Fragment>
  )
}

const LoadingUserShell: FC = (props) => (
  <Fragment>
    <Nav
      homeLink={sitemap.home}
      startItems={
        <Fragment>
          <div className="navbar-item">
            <BlinkingDots />
          </div>
        </Fragment>
      }
    />
    <Body>
      <BouncingDots />
    </Body>
  </Fragment>
)

export { SignedInUserShell, SignedOutUserShell, LoadingUserShell }
