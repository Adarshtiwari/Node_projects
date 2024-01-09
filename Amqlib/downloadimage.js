const amqp = require("amqplib");
const fs = require("fs");
const imageDownload = require("image-download");

async function connect() {
  try {
    // const connection = await amqp.connect("amqp://localhost:5672");
    const connection = await amqp.connect(
      "amqps://tziscvmz:USqRmzw7wWQYwTgYk7_MShLquWXyyblm@shrimp.rmq.cloudamqp.com/tziscvmz"
    );

    const channel = await connection.createChannel();
    const result = channel.assertQueue("download");
    channel.consume("download", async (message) => {
      let arr = JSON.parse(message.content.toString());
      arr.forEach((img) => {
        img.forEach(async (imageurl) => {
          var name = imageurl.split("/");
          var imgname = name[name.length - 1];
          //   download images and save in the images folder;
          (async () => {
            const buffer = await imageDownload(imageurl);
            fs.writeFileSync("./images/" + imgname, buffer, (err) => {
              if (!err) console.log("data save");
              else console.log(err);
            });
          })();
        });
      });
      channel.ack(message);
    });
  } catch (err) {
    console.log(err);
  }
}

connect();
