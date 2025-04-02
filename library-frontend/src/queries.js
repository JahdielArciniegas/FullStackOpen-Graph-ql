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
    author
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