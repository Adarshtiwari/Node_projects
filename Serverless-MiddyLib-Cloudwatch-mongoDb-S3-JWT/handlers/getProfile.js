const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const { errorHandlingMiddleware  ,customErrorHandler} = require("../errorhandler/customhandler");
const { GenrateToken,validateToken } = require("../middleware/util");
const {getProfile } = require("../Service/Auth_service");

require("dotenv").config();
const mongoose = require("mongoose");
require("dotenv").config();



module.exports.handler = middy( async  (event, context) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
    mongoose.disconnect();

    return {
      statusCode: event.body.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body.statusCode,
        data:event.body
      }),
    };
  } catch (error) {
    return {
      statusCode: event.body.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body.statusCode,
      }),
    };
    // throw error;
  }
})
// .use(validateToken())
.use(getProfile())
// .use({
//   onError: (handler, next) => {
//     // Pass the error to the custom error handler
//     console.log(" handler error ",handler)
//     const  error = handler.error;
//     return customErrorHandler(error, handler);
//   },
// });

