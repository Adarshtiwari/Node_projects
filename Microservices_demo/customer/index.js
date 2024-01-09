var express = require("express");
const app = express();
const port = 8003;

app.listen(port, () => {
  console.log("listen from customer");
});

app.use("/", (req, res, next) => {
  return res.status(200).json("msg from Customer");
});
