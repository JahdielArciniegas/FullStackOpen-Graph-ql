import { useQuery, useLazyQuery } from "@apollo/client"
import { ALL_BOOKS, FILTER_BOOKS, FILTER_GENRES } from "../queries"
import { useEffect, useState } from "react"

const Books = (props) => {
  const [filterBooks, resultFilterBooks] = useLazyQuery(FILTER_BOOKS)
  const resultgenres = useQuery(FILTER_GENRES)
  const result = useQuery(ALL_BOOKS)
  const [books, setBooks] = useState([])

  useEffect(() => {
    if (result.data) {
      setBooks(result.data.AllBooks)
    }
  }, [result])

  const showGenreBooks = (genre) => {
    if( genre === 'ALL'){
      setBooks(result.data.AllBooks)
    } else {
      filterBooks({ variables: { genres: genre } })
    }
  }

  useEffect(() => {
    if (resultFilterBooks.data) {
      setBooks(resultFilterBooks.data.AllBooks)
    }
  }, [resultFilterBooks])
  // eslint-disable-next-line react/prop-types
  if (!props.show) {
    return null
  }

  if (result.loading) {
    return <div>loading...</div>
  }

  if (resultgenres.loading) {
    return <div>loading...</div>
  }

  const genres = resultgenres.data.FilterGenres
  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>author</th>
            <th>published</th>
          </tr>
          {books.map((a) => (
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <h3>Filter by genre</h3>
        <div>
          {genres.map((g) => (
            <button key={g} value={g} onClick={() => showGenreBooks(g)}>{g}</button>
          ))}
          <button type="button" onClick={() => showGenreBooks('ALL')}>All</button>
        </div>
      </div>
    </div>
  )
}

export default Books
