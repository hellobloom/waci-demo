import { createContext, Dispatch, FC, SetStateAction, useCallback, useContext, useState } from 'react'

import { UserView } from '@waci-demo/shared'

type UserContextType = {
  user?: UserView | null
  setUser?: Dispatch<SetStateAction<UserView | null | undefined>>
}

const UserContext = createContext<UserContextType>({})

export const UserContextProvider: FC = (props) => {
  const [user, setUser] = useState<UserView | null>()

  return <UserContext.Provider value={{ user, setUser }}>{props.children}</UserContext.Provider>
}

export const useUserContext = () => {
  const { user, setUser } = useContext(UserContext)

  if (!setUser) throw new Error('Not using within UserContext.Provider')

  return { user, setUser }
}

export const useUser = () => {
  const { user } = useUserContext()

  if (!user) throw new Error('User is not set')

  return user
}

export const useClearUser = () => {
  const { setUser } = useUserContext()

  const clearUser = useCallback(() => {
    setUser(undefined)
  }, [setUser])

  return clearUser
}
