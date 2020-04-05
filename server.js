/** This is our server file! Where the magic happens. **/

// require express, for routing, and body parser, for form parsing
let express = require('express'),
    bodyParser = require('body-parser');

// connect to db models
let db = require('./models');

// make a new express app named "app".
let app = express();

// Body parser and encoding setup.
app.use(bodyParser.urlencoded({
    extended: true
}));

// get all
app.get('/api/books', (req, res) => {
	db.Book.find((err,allBooks) =>{
	if (err){
		console.log('index error: $(err)')
	}else{
		res.json({
			books:allBooks
		});
	}

	});

});

// get a book
app.get('/api/books/:id', (req, res) => {
	db.Book.findOne({
		_id:req.params.id
	}, (err, book)=>{
		if (err){
			console.log('show error: ${err}');
		}
		res.json(book);
	});
});

// create new 
app.post('/api/books', (req, res) => {
  let newBook = new db.Book(req.body);
  newBook.save((err, book) => {
    if (err) {
      console.log(`save error: ${err}`);
    }
    console.log(`saved new book: ${book.name}`);
    res.json(book);
  });
});

// delete a book
app.delete('/api/books/:id', (req, res) => {
  let bookId = req.params.id;
  db.Book.findOneAndRemove({
    _id: bookId
  })
  .populate('book')
  .exec((err, deletedBook) => {
    res.json(deletedBook);
  });
});

// update a book

app.put('/api/books/:id', (req, res) => {
  let bookId = req.params.id;
  db.Book.findOne({
    _id: bookId
  }, (err, foundBook) => {
    if (err) {
      console.log('cound not find the book.')
    }
    foundBook.name = req.body.name || foundBook.name;
    foundBook.author = req.body.type || foundBook.author;
    foundBook.category = req.body.category || foundBook.category;
    foundBook.isEasyRead = req.body.isEasyRead || foundBook.isEasyRead;
    console.log(`updating: ${foundBook.name}`);
    //save it
    foundBook.save((err, book) => {
      if (err) {
        console.log(`update error: ${err}`);
      }
      console.log(`updated: ${book.name}`);
      res.json(book);
    });
  });
});


// This is where we serve our API!
app.listen(process.env.PORT || 5000, () => {
    console.log('API is running on http://localhost:5000/');
});
