const jwt = require("jsonwebtoken");
require("dotenv").config();
exports.GenrateToken = (email) => {
  try {
    console.log(" before error", email);

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    let data = {
      time: Date(),
      userId: email,
    };

    const token = jwt.sign(data, jwtSecretKey);
    return token;
    // console.log("the token ",handler.event)

    // return (handler);
  } catch (error) {
    throw error;
  }
};

exports.validateToken = (handler) => {
  // Tokens are generally passed in the header of the request
  // Due to security reasons.
  try {
    console.log(" handler ", handler);
    let jwtSecretKey = process.env.JWT_SECRET_KEY;

    Token = handler.event.headers.authorization.split(" ");
    const verified = jwt.verify(Token[1], jwtSecretKey);
    if (verified) {
      console.log(" valid token");

      return true;
    } else {
      // Access Denied

      console.log("not valid token");

      return false;
    }
  } catch (error) {
    console.log("error found in validation");

    return false;
  }
};
