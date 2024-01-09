const express = require("express");
const { PORT } = require("./config");
const { databaseConnection } = require("./database");
const expressApp = require("./express-app");

const StartServer = async () => {
  console.log("start");
  const app = express();

  await databaseConnection();

  await expressApp(app);

  app
    .listen(PORT, () => {
      console.log(`listening to port ${PORT}`);
    })
    .on("error", (err) => {
      console.log(err);
      process.exit();
    });

  app.use("/", (req, res, next) => {
    return res.status(200).json("msg from Customer");
  });
};

StartServer();
