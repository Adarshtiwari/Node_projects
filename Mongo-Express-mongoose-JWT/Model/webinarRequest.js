const mongoose = require('mongoose');

const WebinarRequest=new mongoose.Schema({
    Name:String,
    Email:String,
    PhoneNumber:String,
    Address:Object,
    pincode:Number,
    Date:String
})

module.exports =mongoose.model('WebinarRequest',WebinarRequest,'WebinarRequest')