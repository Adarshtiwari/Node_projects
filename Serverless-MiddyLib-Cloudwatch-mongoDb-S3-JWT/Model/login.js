
const mongoose = require('mongoose');
 
const User_Auth = new mongoose.Schema({
    Email: String,
    Password:String
});
 
module.exports = mongoose.model(
    'User_Auth', User_Auth, 'User_Auth');