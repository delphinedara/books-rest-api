const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  author: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  isEasyRead: { type: Boolean, default: false }
});

module.exports = mongoose.model('Book', BookSchema);
