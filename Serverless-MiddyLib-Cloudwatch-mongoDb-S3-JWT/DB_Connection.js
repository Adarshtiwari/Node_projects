const mongoose = require("mongoose");
const { handler } = require("./handlers/signup");
require("dotenv").config();

const uri = process.env.DB_URI;

module.exports.DB_Connection = () => {
  try{
   return {
     before: async (handler,next) => {
      console.log(" the before")
      await mongoose.connect(uri,{serverSelectionTimeoutMS: 5000})
      console.log(" DB Connected")
      return next()
     },
   
   };
  }
  catch(err)
  {

  return next(handler.event.status=err)
  }
 };