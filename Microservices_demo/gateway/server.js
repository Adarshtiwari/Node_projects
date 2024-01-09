var express = require("express");
var cors = require("cors");
var proxy = require("express-http-proxy");
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.use("/customer", proxy("http://localhost:8003"));
app.use("/shopping", proxy("http://localhost:8002"));
app.use("/product", proxy("http://localhost:8001"));

app.listen(port, () => {
  console.log("listen from gatway");
});

app.use("/", (req, res, next) => {
  return res.status(200).json("msg from gatway");
});
