const mongoose = require("mongoose");
// const { DB_URL } = require("../config");

module.exports = async () => {
  try {
    const DB_URL =
      "mongodb+srv://adarsh:C.happy@2022@cluster0.gs0ss23.mongodb.net/?retryWrites=true&w=majority";

    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Db Connected");
  } catch (error) {
    console.log("Error ============");
    console.log(error);
    process.exit(1);
  }
};
