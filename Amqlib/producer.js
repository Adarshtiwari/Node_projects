const amqp = require("amqplib");
const msg = "{name:'Adarsh'}";

async function connect() {
  try {
    // const connection = await amqp.connect("amqp://localhost:5672");
    const connection = await amqp.connect(
      "amqps://tziscvmz:USqRmzw7wWQYwTgYk7_MShLquWXyyblm@shrimp.rmq.cloudamqp.com/tziscvmz"
    );
    const channel = await connection.createChannel();
    const result = await channel.assertQueue("nametransfer");

    channel.sendToQueue("nametransfer", Buffer.from(JSON.stringify(msg)));
    console.log("message publish", msg);
  } catch (err) {
    console.log(err);
  }
}
connect();
