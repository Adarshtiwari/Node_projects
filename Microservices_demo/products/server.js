var express = require("express");
const app = express();
const port = 8001;

app.listen(port, () => {
  console.log("listen from Product");
});

app.use("/", (req, res, next) => {
  return res.status(200).json("msg from Product");
});
