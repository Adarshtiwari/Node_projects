const axios = require("axios");
const fs = require("fs");
const { connect } = require("http2");
const amqp = require("amqplib");
const msg = "{name:'Adarsh'}";

const finalproductdata = [];
axios
  .get("https://dummyjson.com/products?limit=10")
  .then((res) => {
    //   console.log(res.data);
    const productsdata = fs.readFileSync("./productcolor.json");
    const productcolor = JSON.parse(productsdata);
    const productcolormap = [];
    productcolor.forEach((element) => {
      productcolormap[element.productid] = element.color;
    });
    res.data.products.forEach((pdata) => {
      pdata["color"] = productcolormap[pdata.id];
      finalproductdata.push(pdata);
    });

    return finalproductdata;
  })
  .then((data) => {
    connectdata(data);
  });

async function connectdata() {
  try {

    const connection = await amqp.connect(
      "amqps://tziscvmz:USqRmzw7wWQYwTgYk7_MShLquWXyyblm@shrimp.rmq.cloudamqp.com/tziscvmz"
    );
    const channel = await connection.createChannel();
    const reorderresult = await channel.assertQueue("reorder");

    var reorderdata = [];
    finalproductdata.forEach((pdata) => {
      if (pdata.stock < 50) {
        reorderdata.push({
          id: pdata.id,
          color: pdata.color,
          stock: pdata.stock,
        });
      }
    });

    channel.sendToQueue("reorder", Buffer.from(JSON.stringify(reorderdata)));
    console.log("message publish", reorderdata);

    const downloadimageresult = await channel.assertQueue("download");
    var downloaddata = [];
    finalproductdata.forEach((pdata) => {
      downloaddata.push(pdata.images);
    });
    channel.sendToQueue("download", Buffer.from(JSON.stringify(downloaddata)));
    console.log("download message publish", downloaddata);
  } catch (err) {
    console.log(err);
  }
}
// connect();
