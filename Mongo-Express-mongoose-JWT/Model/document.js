const mongoose = require('mongoose');
 
const documnet = new mongoose.Schema({
    details: String,
    Data:String
});
 
module.exports = mongoose.model(
    'Document', documnet, 'Document');