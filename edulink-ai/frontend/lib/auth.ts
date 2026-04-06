export const getToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('token') : null

export const setToken = (token: string) =>
  typeof window !== 'undefined' && localStorage.setItem('token', token)

export const removeToken = () =>
  typeof window !== 'undefined' && localStorage.removeItem('token')

export const setUser = (user: object) =>
  typeof window !== 'undefined' && localStorage.setItem('user', JSON.stringify(user))

export const getUser = () => {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('user')
  return u ? JSON.parse(u) : null
}

export const removeUser = () =>
  typeof window !== 'undefined' && localStorage.removeItem('user')

export const logout = () => {
  removeToken()
  removeUser()
  window.location.href = '/login'
}
