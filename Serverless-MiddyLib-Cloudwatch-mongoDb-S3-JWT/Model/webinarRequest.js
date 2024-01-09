const mongoose = require('mongoose');

const EventRequest=new mongoose.Schema({
    Name:String,
    Email:String,
    PhoneNumber:String,
    Address:Object,
    pincode:Number,
    Date:String,
    AboutEvent:String
})

module.exports =mongoose.model('EventRequest',EventRequest,'EventRequest')