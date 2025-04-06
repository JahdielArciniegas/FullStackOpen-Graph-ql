import { gql } from "@apollo/client";

export const CREATE_BOOK = gql`
  mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!){
    addBook(title: $title, author: $author, published: $published, genres: $genres){
      title
      author
      published
      genres
    }
  }
`
export const ALL_BOOKS = gql`
query{
  AllBooks{
    title
    author {
      name
      born
      booksCount
    }
    published
  }
}`

export const ALL_AUTHORS = gql`
query {
AllAuthors{
  name
  born
  booksCount
}
}
`

export const UPDATE_AUTHOR = gql`
  mutation updateAuthor($name: String!, $setBornTo: Int!){
    editAuthor(name: $name, setBornTo: $setBornTo){
      name
      born
      booksCount
    }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`