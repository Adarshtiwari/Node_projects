const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const { errorHandlingMiddleware  ,customErrorHandler} = require("../errorhandler/customhandler");
const { GenrateToken } = require("../middleware/util");
const {CreateService } = require("../Service/event_service");


require("dotenv").config();
const mongoose = require("mongoose");




module.exports.handler = middy( async  (event, context) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
   await mongoose.disconnect();
    console.log(" the main handler", typeof event);
    return {
      statusCode: event.body.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',  // Update this with your allowed origins
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body,
      }),
     
    };
  } catch (error) {
    return {
      statusCode: event.body.statusCode,
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body.data,
      }),
      headers: {
        'Access-Control-Allow-Origin': '*',  // Update this with your allowed origins
        'Access-Control-Allow-Credentials': true,
      },
    };
    // throw error;
  }
})
.use(CreateService())


