const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const {
  errorHandlingMiddleware,
  customErrorHandler,
} = require("../errorhandler/customhandler");
const { GenrateToken } = require("../middleware/util");
const { signup } = require("../Service/Auth_service");
const { DB_Connection } = require("../DB_Connection");
require("dotenv").config();
const mongoose = require("mongoose");
require("dotenv").config();
const uri = process.env.DB_URI;

module.exports.handler = middy(async (event) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
   await mongoose.disconnect();
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
        statusCode: event.body.statusCode,
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
  .use(signup())
  // .use({
  //   onError: (handlerr, next) => {
  //     // Pass the error to the custom error handler
  //     console.log(" handler error **** ", handlerr.error);
  //     const { error } = handlerr.error;
  //     return customErrorHandler(error, handlerr);
  //   },
  // });
// .use(errorHandlingMiddleware())
