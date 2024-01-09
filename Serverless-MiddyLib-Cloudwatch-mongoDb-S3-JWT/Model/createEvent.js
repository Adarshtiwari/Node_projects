const mongoose = require('mongoose');

const createEvent=new mongoose.Schema({
    Name:String,
    Image:Object
})

module.exports =mongoose.model('createEvent',createEvent,'createEvent')