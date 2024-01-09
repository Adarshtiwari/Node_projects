const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const { errorHandlingMiddleware  ,customErrorHandler} = require("../errorhandler/customhandler");
const { GenrateToken,validateToken } = require("../middleware/util");
const {getAllEvent } = require("../Service/event_service");

require("dotenv").config();
const mongoose = require("mongoose");
require("dotenv").config();



module.exports.handler = middy( async  (event, context) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
    mongoose.disconnect();

    return {
      statusCode: event.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.Status,
        error: event.error,
        data:event.data
      }),
    };
  } catch (error) {

    console.error(" error found ",error)
    return {
      statusCode: event.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.Status,
        error: event.error,
        statusCode: event.statusCode,

      }),
    };
    // throw error;
  }
})
// .use(validateToken())
.use(getAllEvent())
// .use({
//   onError: (handler, next) => {
//     // Pass the error to the custom error handler
//     console.log(" handler error ",handler)
//     const  error = handler.error;
//     return customErrorHandler(error, handler);
//   },
// });

