let mongoose = require('mongoose');
// This is where we serve our DB!
mongoose.connect(
    process.env.MONGODB_URI ||
    'mongodb://localhost/books-rest-api'
);


let Book = require('./book');

module.exports.Book=Book;