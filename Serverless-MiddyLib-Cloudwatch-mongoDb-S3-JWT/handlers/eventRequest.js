const middy = require("middy");
const { jsonBodyParser, httpErrorHandler } = require("middy/middlewares");
const { errorHandlingMiddleware  ,customErrorHandler} = require("../errorhandler/customhandler");
const { GenrateToken } = require("../middleware/util");
const {WebinarRequest } = require("../Service/event_service");

require("dotenv").config();
const mongoose = require("mongoose");



// app.post('/createevent', async (req, event) => {
//   try {
//         // event=JSON.parse(event)
//         console.log("event  ",event)
//        await mongoose.disconnect();
//         console.log(" the main handler", typeof event);
//         return {
//           statusCode: event.body.statusCode,
//           headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Credentials': true,
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
            
//           },
//           body: JSON.stringify({
//             status: event.body.Status,
//             error: event.body.error,
//             statusCode: event.body.statusCode,
//           }),
//         };
//       } catch (error) {
//         return {
//           statusCode: event.body.statusCode,
//           headers: {
//             'Access-Control-Allow-Origin': '*',
//             'Access-Control-Allow-Credentials': true,
//             'Access-Control-Allow-Headers': 'Content-Type',
//             'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
//           },
//           body: JSON.stringify({
//             status: event.body.Status,
//             error: event.body.error,
//             statusCode: event.body.statusCode,
//           }),
//         };
//         // throw error;
//       }
// });
// module.exports.handler = middy( serverless(app)).use(WebinarRequest());





module.exports.handler = middy( async  (event, context) => {
  try {
    // event=JSON.parse(event)
    console.log("event  ",event)
   await mongoose.disconnect();
    console.log(" the main handler", typeof event);
    return {
      statusCode: event.body.statusCode,
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body.statusCode,
      }),
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',
      },
    };
  } catch (error) {
    return {
      statusCode: event.body.statusCode,
  
      body: JSON.stringify({
        status: event.body.Status,
        error: event.body.error,
        statusCode: event.body.statusCode,
      }),
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:4200',
        'Access-Control-Allow-Credentials': true,
        'Content-Type': 'application/json',

      },
    };
    // throw error;
  }
})
.use(WebinarRequest())

