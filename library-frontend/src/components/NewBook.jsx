import { useMutation } from '@apollo/client'
import { useState } from 'react'
import { ALL_AUTHORS, ALL_BOOKS, CREATE_BOOK } from '../queries'



const NewBook = (props) => {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [published, setPublished] = useState('')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState([])
const [createBook] = useMutation(CREATE_BOOK, {
  update: (cache, response) => {
    const addedBook = response.data.addBook
    addedBook.genres.forEach((g) => {
      try {
        cache.updateQuery(
          {
            query: ALL_BOOKS,
            variables: { genre: g }
          },
          (data) => {
            if (!data) return null

            const alreadyIncluded = data.allBooks.some(b => b.id === addedBook.id)
            if (alreadyIncluded) return data

            return {
              allBooks: [...data.allBooks, addedBook]
            }
          }
        )
      } catch (e) {
        console.log(`Género ${g} aún no está en caché`)
      }
    })

    cache.updateQuery({ query: ALL_AUTHORS }, (data) => {
      if (!data) return null
      return data
    })
  }
})
  // eslint-disable-next-line react/prop-types
  if (!props.show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    const date = Number(published)
    console.log('add book...')
    createBook({ variables : {title, author,published: date,genres}})

    setTitle('')
    setPublished('')
    setAuthor('')
    setGenres([])
    setGenre('')
  }

  const addGenre = () => {
    setGenres(genres.concat(genre))
    setGenre('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          title
          <input
            value={title}
            onChange={({ target }) => setTitle(target.value)}
          />
        </div>
        <div>
          author
          <input
            value={author}
            onChange={({ target }) => setAuthor(target.value)}
          />
        </div>
        <div>
          published
          <input
            type="number"
            value={published}
            onChange={({ target }) => setPublished(target.value)}
          />
        </div>
        <div>
          <input
            value={genre}
            onChange={({ target }) => setGenre(target.value)}
          />
          <button onClick={addGenre} type="button">
            add genre
          </button>
        </div>
        <div>genres: {genres.join(' ')}</div>
        <button type="submit">create book</button>
      </form>
    </div>
  )
}

export default NewBook