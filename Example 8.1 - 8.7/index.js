const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { GraphQLError } = require("graphql");
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
  type Author {
    name: String!
    id: ID!
    born: Int
    booksCount: Int!
  }
  
  type Book {
    title: String!
    published: Int!
    author: Author!
    id: ID!
    genres: [String!]!
  }

  type Mutation {
    addBook(
      title: String!
      published: Int!
      author: String!
      genres: [String!]!
    ): Book
    editAuthor(
      name: String!
      setBornTo: Int!
      ):Author  
  }

  type Query {
    BooksCount: Int!
    AuthorsCount: Int! 
    AllBooks(author: String, genres: String): [Book!]!
    AllAuthors: [Author!]!
    }
`;


const resolvers = {
  Query: {
    BooksCount: async() => Book.collection.countDocuments(),
    AuthorsCount: async() => Author.collection.countDocuments(),
    AllBooks: async (root, args) => {
      if (args.author && args.genres) {
        return books.filter(
          (book) =>
            book.author === args.author && Book.find({ genres : {$elemMatch : { $eq : args.genres}}})
        );
      }

      if (args.author) {
        return books.filter((book) => book.author === args.author);
      }

      if (args.genres) {
        return Book.find({ genres : {$elemMatch : { $eq : args.genres}}}).populate('author');
      }

      return Book.find({}).populate('author');
    },
    AllAuthors: async() => Author.find({}),
  },
  Author: {
    booksCount: async (root) => {
      return Book.collection.countDocuments({ author : root.name});
    },
  },
  Mutation: {
    addBook: async (root, args) => {
      if (args.title.length < 2){
        throw new GraphQLError('title must be longer than 2 characters')
      }
      if (args.author.length < 4){
        throw new GraphQLError('name must be longer than 4 characters')
      }
      const author = await Author.findOne({name : args.author})
      if (!author) {
        const author = new Author({name : args.author})
        await author.save()
      }
      const book = new Book({...args});
      return book.save()
    },
    editAuthor: async (root, args) => {
      const author = await Author.findOne({name : args.name})
      author.born = args.setBornTo
      return author.save();
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
