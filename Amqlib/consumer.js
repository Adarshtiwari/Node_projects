const amqp = require("amqplib");

async function connect() {
  try {
    // const connection = await amqp.connect("amqp://localhost:5672");
    const connection = await amqp.connect(
      "amqps://tziscvmz:USqRmzw7wWQYwTgYk7_MShLquWXyyblm@shrimp.rmq.cloudamqp.com/tziscvmz"
    );

    const channel = await connection.createChannel();
    const result = channel.assertQueue("nametransfer");
    channel.consume("nametransfer", (msg) => {
      var receive = JSON.parse(msg.content.toString());
      console.log("REceived the msg", receive);
      channel.ack(msg);
    });
  } catch (err) {
    console.log(err);
  }
}

connect();
