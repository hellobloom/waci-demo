export const getHost = () => {
  return process.env.REACT_APP_SERVER_HOST || window.location.origin
}
