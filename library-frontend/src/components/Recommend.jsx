import { useQuery } from "@apollo/client"
import { FILTER_BOOKS } from "../queries"


const Recommend = (props) => {
  // eslint-disable-next-line react/prop-types
  const result = useQuery(FILTER_BOOKS, { variables: { genres: props.favoriteGenre } })
  if(result.loading){
    return <div>loading...</div>
  }
  const books = result.data.AllBooks
  // eslint-disable-next-line react/prop-types
  if (!props.show) {
    return null
  }
  return (
    <div>
      <h2>Reccommendations</h2>
      <p>books in your favorite genre patterns</p>
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
    </div>
  )
}

export default Recommend
