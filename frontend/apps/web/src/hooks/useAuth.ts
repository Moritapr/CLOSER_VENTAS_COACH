import { useState } from "react"

const TOKEN_KEY = "cvc_auth"
const TOKEN_VALUE = "authenticated"

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem(TOKEN_KEY) === TOKEN_VALUE
  )

  function login(password: string): boolean {
    const correct = import.meta.env.VITE_APP_PASSWORD
    if (password === correct) {
      localStorage.setItem(TOKEN_KEY, TOKEN_VALUE)
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setIsAuthenticated(false)
  }

  return { isAuthenticated, login, logout }
}
