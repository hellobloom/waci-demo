import React, { FC } from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';

import { EntryRoute, ProtectedRoute } from 'routes';
import { Authenticate } from 'pages/Authenticate';
import { Home } from 'pages/Home';
import { LogOut } from 'pages/LogOut';
import { SignIn } from 'pages/SignIn';
import { SignUp } from 'pages/SignUp';
import { sitemap } from 'sitemap';
import reportWebVitals from 'reportWebVitals';
import { SignedOutUserShell, SignedInUserShell, LoadingUserShell } from 'components/Shell';
import { UserContextProvider } from 'components/UserProvider';
import { NotFound } from 'components/NotFound';
import { LocalClientProvider } from 'components/LocalClientProvider';

import 'bulma/css/bulma.min.css'
import 'index.css';
import 'fontawesome';

const App: FC = () => (
  <Switch>
    <EntryRoute exact path={sitemap.signIn} loadingFallback={<LoadingUserShell />}>
      <SignedOutUserShell titleSuffix="Sign In">
        <SignIn />
      </SignedOutUserShell>
    </EntryRoute>

    {/* <EntryRoute exact path={sitemap.authenticate(':token')} loadingFallback={<LoadingUserShell />}>
      <SignedOutUserShell titleSuffix="Authenticate">
        <Authenticate />
      </SignedOutUserShell>
    </EntryRoute> */}

    <Route exact path={sitemap.authenticate(':token')}>
      <SignedOutUserShell titleSuffix="Authenticate">
        <Authenticate />
      </SignedOutUserShell>
    </Route>

    <EntryRoute exact path={sitemap.signUp} loadingFallback={<LoadingUserShell />}>
      <SignedOutUserShell titleSuffix="Sign Up">
        <SignUp />
      </SignedOutUserShell>
    </EntryRoute>

    <ProtectedRoute exact path={sitemap.home} loadingFallback={<LoadingUserShell />}>
      <SignedInUserShell>
        <Home />
      </SignedInUserShell>
    </ProtectedRoute>

    <Route exact path={sitemap.logOut}>
      <SignedInUserShell titleSuffix="Log Out">
        <LogOut />
      </SignedInUserShell>
    </Route>

    <Route path="*">
      <SignedOutUserShell titleSuffix="Not Found">
        <NotFound
          action={{
            text: 'Go Back Home',
            link: sitemap.home,
          }}
        />
      </SignedOutUserShell>
    </Route>
  </Switch>
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

ReactDOM.render(
  <React.StrictMode>
    <LocalClientProvider>
      <UserContextProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <App />
          </Router>
          <ReactQueryDevtools />
        </QueryClientProvider>
      </UserContextProvider>
    </LocalClientProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
