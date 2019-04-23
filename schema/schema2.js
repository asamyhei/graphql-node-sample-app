const gql = require("graphql-tag");
const {find, filter} = require('lodash');
const {makeExecutableSchema} = require("graphql-tools");
const Author = require('../models/author');
const Book = require('../models/book');
const {PubSub} = require('graphql-subscriptions');
const pubSub = new PubSub();

const AUTHOR_ADDED = 'newAuthor';

const typeDefs = gql`

    type Author {
        id: ID!
        name: String
        age: Int
        books: [Book]
    }

    type Book {
        id: ID!
        name: String
        genre: String
        author: Author
    }

    type Query {
        book(id: ID): Book
        author(id: ID): Author
        books: [Book]
        authors: [Author]
    }

    type Mutation {
        addAuthor(name: String!, age: Int!): Author
        updateAuthor(id: ID, name: String, age: Int): Author
        deleteAuthor(id: ID): Author

        addBook(name: String!, genre: String!, authorId: ID!): Book
        updateBook(id: ID!, name: String, genre: String, authorId: ID): Book
        deleteBook(id: ID): Book
    }

    type Subscription {
        authorAdded: Author
    }
`;

const resolvers = {
    Query: {
        books: () => Book.find({}),
        authors: () => Author.find({}),
        book: (parent, args) => Book.findById(args.id),
        author: (parent, args) => Author.findById(args.id),
    },
    Mutation: {
        addAuthor: (parent, args) => {
            let author = new Author({
                name: args.name,
                age: args.age
            });

            let authorSaved = author.save();

            pubSub.publish(AUTHOR_ADDED, authorSaved);

            return authorSaved;
        },
        updateAuthor: (parent, args) => {
            let author = {
                id: args.id,
                name: args.name,
                age: args.age
            };

            for (let prop in author) if (!author[prop]) delete author[prop];

            return Author.findOneAndUpdate({_id: args.id}, author);
        },
        deleteAuthor: (parent, args) => {

            return Author.findOneAndDelete({_id: args.id}, (err, docs) => {
                Book.deleteMany({authorId: args.id}, (err, docs) => {
                });
            });
        },

        addBook: (parent, args) => {
            let book = new Book({
                name: args.name,
                genre: args.genre,
                authorId: args.authorId
            });
            return book.save();
        },
        updateBook: (parent, args) => {
            let book = {
                name: args.name,
                genre: args.genre,
                authorId: args.authorId
            };
            for (let prop in book) if (!book[prop]) delete book[prop];

            return Book.findOneAndUpdate({_id: args.id}, book);
        },
        deleteBook: (parent, args) => {
            return Book.findOneAndDelete({_id: args.id});
        }

    },
    Subscription: {
        authorAdded: {
            subscribe: () => pubSub.asyncIterator(AUTHOR_ADDED)
        }

    },
    Author: {
        books: (author) => Book.find({authorId: author.id})
    },
    Book: {
        author: (book) => Author.find({authorId: book.authorId})
    },
};

module.exports = makeExecutableSchema({
    typeDefs,
    resolvers,
});

