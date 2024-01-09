const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const { errorHandlingMiddleware  ,customErrorHandler} = require("../errorhandler/customhandler");
const { GenrateToken } = require("../middleware/util");
const {updateProfile } = require("../Service/Auth_service");

require("dotenv").config();
const mongoose = require("mongoose");
require("dotenv").config();



module.exports.handler = middy( async  (event, context) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
    mongoose.disconnect();
    console.log(" the main handler", typeof event);
    return {
      statusCode: event.body.statusCode,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        body: event.body,
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
// .use(DB_Connection())/
.use(updateProfile())
// .use({
//   onError: (handler, next) => {
//     // Pass the error to the custom error handler
//     console.log(" handler error ",handler.error)
//     const { error } = handler.error;
//     return customErrorHandler(error, handler);
//   },
// });
