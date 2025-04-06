import { useState } from "react";
import Authors from "./components/Authors";
import Books from "./components/Books";
import NewBook from "./components/NewBook";
import Login from "./components/Login";
import { useApolloClient, useQuery } from "@apollo/client";
import Recommend from "./components/Recommend";
import { ME } from "./queries";

const App = () => {
  const resultMe = useQuery(ME)
  
  
  const [token, setToken] = useState(null)
  const [page, setPage] = useState("authors");
  const client = useApolloClient()
  const handleToken = (token) => {
    setToken(token)
  }
  if (resultMe.loading) {
    return <div>loading...</div>
  } 
  const favoriteGenre = resultMe.data.me.favoriteGenre
  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage("authors")}>authors</button>
        <button onClick={() => setPage("books")}>books</button>
        {token && <button onClick={() => setPage("add")}>add book</button>}
        {token && <button onClick={() => setPage("recommend")}>recommend</button>}
        {!token ? <button onClick={() => setPage("login")}>login</button> : <button onClick={logout}>logout</button>}
      </div>

      <Authors show={page === "authors"} token={token}/>

      <Books show={page === "books"} />

      <NewBook show={page === "add"} />

      <Login show={page === "login"} handleToken={handleToken} token={token}/>

      <Recommend show={page === "recommend"} favoriteGenre={favoriteGenre}/>
    </div>
  );
};

export default App;
