exports.errorHandlingMiddleware = () => {
  return {
    onError: async (handler, next) => {
      const { error } = handler;
      console.error("Error:", handler);
      console.log("in the error handler");
      return {
        statusCode: error.statusCode || 500,
        body: JSON.stringify({
          message: error.message || "Internal Server Error",
        }),
      };

      // return next();
    },
  };
};

exports.customErrorHandler = (Error, handler1) => {
  return {
    onError: async (handler, next) => {
      const { error } = handler;
      console.log("Error the handadsadasafa *****:", handler);
      console.log("Error the adarsh *****:", handler1);
      return {
        statusCode: error.statusCode || 500,
        body: JSON.stringify({
          message: Error || "Internal Server Error adarsh",
        }),
      };

  
    },
  };
};

// module.exports = customErrorHandler;
