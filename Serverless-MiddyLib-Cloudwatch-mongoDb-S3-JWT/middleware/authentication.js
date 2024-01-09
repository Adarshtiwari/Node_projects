exports.inputValidationMiddleware = () => {
   try{
    return {
      before: async (handler) => {
       console.log(" the before")
      },
      after:async(handler)=>{
console.log("after")
      }
    };
   }catch(err)
   {
    throw err
   }
  };