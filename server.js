const express = require('express');
const graphqlHttp = require('express-graphql');
const schema1 = require('./schema/schema');
const schema2 = require('./schema/schema2');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const uri = "mongodb+srv://test:test123@cluster0-10jva.mongodb.net/gql-tuto?retryWrites=true";

app.use(cors());

mongoose.connect(uri);

mongoose.connection.once('open', () => {
   console.log('connection open');
});

app.use('/graphql', graphqlHttp({schema: schema2, graphiql: true}));

app.listen(process.env.PORT || 4000, () => {
    console.log("Listening on port 4000");
});
