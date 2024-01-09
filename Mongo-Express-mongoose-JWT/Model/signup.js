
const mongoose = require('mongoose');
 
const CreatUser = new mongoose.Schema({
    Email: String,
    Password:String,
    PhoneNumber:String,
    DOB:String,
    PROFILE:String
});
 
module.exports = mongoose.model(
    'User_Info', CreatUser, 'User_Info');