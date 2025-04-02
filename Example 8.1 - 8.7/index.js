const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { v4: uuid } = require("uuid");
const mongoose = require("mongoose");
require('dotenv').config()
const Author = require("./models/author");
const Book = require("./models/book");

mongoose.connect(process.env.URL_MONGO_DB).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.log("Error connecting to MongoDB",error.message)
})

/*
 * Spanish:
 * Podría tener más sentido asociar un libro con su autor almacenando la id del autor en el contexto del libro en lugar del nombre del autor
 * Sin embargo, por simplicidad, almacenaremos el nombre del autor en conexión con el libro
 */


const typeDefs = `
  type Authors {
    name: String!
    id: ID!
    born: Int
    booksCount: Int!
  }
  
  type Books {
    title: String!
    published: Int!
    author: Authors!
    id: ID!
    genres: [String!]!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Books
    editAuthor(
      name: String!
      setBornTo: Int!
      ):Authors
  }

  type Query {
    BooksCount: Int!
    AuthorsCount: Int! 
    AllBooks(author: String, genres: String): [Books!]!
    AllAuthors: [Authors!]!
    }
`;

const resolvers = {
  Query: {
    BooksCount: async() => books.length,
    AuthorsCount: async() => authors.length,
    AllBooks: async (root, args) => {
      if (args.author && args.genres) {
        return books.filter(
          (book) =>
            book.author === args.author && book.genres.includes(args.genres)
        );
      }

      if (args.author) {
        return books.filter((book) => book.author === args.author);
      }

      if (args.genres) {
        return books.filter((book) => book.genres.includes(args.genres));
      }

      return Book.find({});
    },
    AllAuthors: async() => Author.find({}),
  },
  Authors: {
    booksCount: (root) => {
      return books.filter((books) => books.author === root.name).length;
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      const book = { ...args, id: uuid() };
      if (!authors.find((author) => author.name === args.author)) {
        authors = authors.concat({ name: args.author, id: uuid() });
      }
      books = books.concat(book);
      return book;
    },
    editAuthor: async (root, args) => {
      const author = authors.find((author) => author.name === args.name);
      if (!author) {
        return null;
      }
      const updatedAuthor = { ...author, born: args.setBornTo };
      authors = authors.map((author) =>
        author.name === args.name ? updatedAuthor : author
      );
      return updatedAuthor;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
