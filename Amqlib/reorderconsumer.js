const amqp = require("amqplib");
const fs = require("fs");

async function connect() {
  try {
    // const connection = await amqp.connect("amqp://localhost:5672");
    const connection = await amqp.connect(
      "amqps://tziscvmz:USqRmzw7wWQYwTgYk7_MShLquWXyyblm@shrimp.rmq.cloudamqp.com/tziscvmz"
    );

    const channel = await connection.createChannel();
    const result = channel.assertQueue("reorder");
    channel.consume("reorder", (message) => {
      var d = new Date();
      var today =
        d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
      fs.writeFileSync("./reorderdata/" + today + ".txt", message.content);
      channel.ack(message);
    });
  } catch (err) {
    console.log(err);
  }
}

connect();

//  var receive = JSON.parse(message.content.toString());
//  console.log("REceived the msg", receive);
