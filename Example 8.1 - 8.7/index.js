const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { GraphQLError } = require("graphql");
const mongoose = require("mongoose");
require('dotenv').config()
const Author = require("./models/author");
const User = require("./models/user");
const Book = require("./models/book");
const jwt = require("jsonwebtoken")

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

  type Query {
    BooksCount: Int!
    AuthorsCount: Int! 
    AllBooks(author: String, genres: String): [Book!]!
    AllAuthors: [Author!]!
    me: User
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
    me: async (root, args, context) => {
      return context.currentUser;
    }
  },
  Author: {
    booksCount: async (root) => {
      return Book.collection.countDocuments({ author : root.name});
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
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

startStandaloneServer(server, {
  listen: { port: 4000 },
  context: async ({ req, res }) => {
    const auth = req ? req.headers.authorization : null
    if (auth && auth.startsWith('Bearer ')) {
      const decodedToken = jwt.verify(
        auth.substring(7), process.env.SECRET
      )
      const currentUser = await User
        .findById(decodedToken.id)
      return { currentUser }
    }
  }
}).then(({ url }) => {
  console.log(`Server ready at ${url}`);
});
