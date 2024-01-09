const mongoose = require('mongoose');

const createService=new mongoose.Schema({
    Name:String,
    html:Object
})

module.exports =mongoose.model('createService',createService,'createService')