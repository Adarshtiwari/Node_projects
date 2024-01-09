var express = require("express");
const app = express();
const port = 8002;

app.listen(port, () => {
  console.log("listen from Shopping");
});

app.use("/", (req, res, next) => {
  return res.status(200).json("msg from Shopping");
});
