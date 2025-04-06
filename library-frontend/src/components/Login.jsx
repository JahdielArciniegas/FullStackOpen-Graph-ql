import { useMutation } from "@apollo/client"
import { useEffect, useState } from "react"
import { ALL_AUTHORS, LOGIN } from "../queries"

// eslint-disable-next-line react/prop-types
const Login = ({show, handleToken, token }) => {

  const [password, setPassword ] =useState("")
  const [username, setUsername ] =useState("")
  const [login, result] = useMutation(LOGIN, {
    refetchQueries: [{ query: ALL_AUTHORS }]
  })

  useEffect(() => {
    if(result.data){
      const token = result.data.login.value
      handleToken(token)
      localStorage.setItem('user-token', token)
    }
  }, [result.data]) // eslint-disable-line

  if (!show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    login({variables: {username, password}})
  }

  if(token){
    return (
      <div>
        <p>Login successful</p>
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
        name <input type="text" value={username} onChange={e => setUsername(e.target.value)}/>
      </div>
      <div>
        password <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
      </div>
      <button type="submit">login</button>
      </form>
    </div>
  )
}

export default Login
