import { ApolloServer } from "@apollo/server";
import http from "http";
import { GraphQLError } from "graphql";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Author from "./models/author.js";
import User from "./models/user.js";
import Book from "./models/book.js";
import jwt from "jsonwebtoken"
import { PubSub } from "graphql-subscriptions";
import { makeExecutableSchema } from "@graphql-tools/schema";
const pubsub = new PubSub();
import { startStandaloneServer } from "@apollo/server/standalone";
import { useServer } from "graphql-ws/use/ws";
import { WebSocketServer } from "ws";

dotenv.config();

mongoose.connect(process.env.URL_MONGO_DB).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.log("Error connecting to MongoDB",error.message)
})

const typeDefs = `
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

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
    createUser(
      username: String!
      favoriteGenre: String!
    ): User  
    login(
      username: String!
      password: String!
    ): Token
  }

  type Subscription {
    bookAdded: Book!
  }

  type Query {
    BooksCount: Int!
    AuthorsCount: Int! 
    AllBooks( genres: String): [Book!]!
    AllAuthors: [Author!]!
    me: User
    FilterGenres: [String!]
  }
`;

const resolvers = {
  Query: {
    BooksCount: async() => Book.collection.countDocuments(),
    AuthorsCount: async() => Author.collection.countDocuments(),
    AllBooks: async (root, args) => {
      if (args.genres) {
        return Book.find({ genres : {$elemMatch : { $eq : args.genres}}}).populate('author');
      }

      return Book.find({}).populate('author');
    },
    AllAuthors: async() => Author.find({}),
    me: async (root, args, context) => {
      return context.currentUser;
    },
    FilterGenres: async () => {
      return Book.collection.distinct('genres');
    }
  },
  Author: {
    booksCount: async (root) => {
      const booksWithAuthor = await Book.find({}).populate('author');
      return booksWithAuthor.filter((book) => book.author.name === root.name).length;
    },
  },
  Mutation: {
    createUser: async (root, args) => {
      const user = new User({
        username: args.username,
        favoriteGenre: args.favoriteGenre
      })
      return user.save()
      .catch(error => {
        throw new GraphQLError('Invalid username or password',{extensions: {code: "BAD_USER_INPUT"}})
      })
    },
    login: async (root, args) => {
      const user = await User.findOne({ username: args.username })
      if( !user || args.password !== 'secret') {
        throw new GraphQLError('Invalid username or password',{extensions: {
          code: "BAD_USER_INPUT"}
        })
      }
      const userForToken = {
        username : user.username,
        id: user._id
      }

      return {value : jwt.sign(userForToken, process.env.SECRET)}
    },
    addBook: async (root, args, { currentUser}) => {
      if (!currentUser) {
        throw new GraphQLError('not authenticated', { extensions: { code: 'BAD_USER_INPUT' } })
      }
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
      pubsub.publish('BOOK_ADDED', { bookAdded: book })
      return book.save()
    },
    editAuthor: async (root, args, { currentUser}) => {
      if (!currentUser) {
        throw new GraphQLError('not authenticated', { extensions: { code: 'BAD_USER_INPUT' } })
      }
      const author = await Author.findOne({name : args.name})
      author.born = args.setBornTo
      return author.save();
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
    }
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const httpServer = http.createServer()
const server = new ApolloServer({
  schema,
  context: async({req}) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.SECRET
      )
      const currentUser = await User.findById(decodedToken.id)
      return { currentUser, pubsub }
    }
    return { pubsub }
  }
});

const start = async () => {
  const {url} = await startStandaloneServer(server, {
    listen: {port:4000},
    server: httpServer
  })
  await server.start()
  console.log(`🚀 HTTP server ready at ${url}`)

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  })

  useServer({schema,context: async() => ({pubsub})}, wsServer)

  console.log(`📡 Subscriptions ready at ws://localhost:4000/graphql`)
}

start()





