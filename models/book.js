// set up mongoose
let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let BookSchema = new Schema({
	//model properties
	name:String,
	author:String,
	category: String,
	isEasyRead: Boolean,
});

let Book = mongoose.model('Book', BookSchema);

module.exports = Book;
