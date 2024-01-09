const WebinarRequest = require("../Model/webinarRequest");
const CreateService = require("../Model/CreateService_model");
const Email = require("../middleware/mail_Helper");
const mongoose = require("mongoose");
require("dotenv").config();
const JWT = require("../middleware/util");
const createUser = require("../Model/signup");
const uuid = require("uuid");
const upload = require("../middleware/uploadfile");
const getfile = require("../middleware/getfile");
const constant = require("../constant");
const EventCreate = require("../Model/createEvent");

exports.WebinarRequest = () => {
  try {
    return {
      before: async (handler, next) => {
        const uri = process.env.DB_URI;
        console.log("parse ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        const webinarRequest = new WebinarRequest({
          Name: handler.event.body.name,
          Email: handler.event.body.email,
          PhoneNumber: handler.event.body.phonenumber,
          Address: handler.event.body.address,
          pincode: handler.event.body.pincode,
          Date: handler.event.body.date,
          AboutEvent: handler.event.body.aboutevent,
        });

        await webinarRequest.save();
        try {
          Email.mailSender(handler.event.body);
          handler.event.body.statusCode = 200;
          handler.event.body.error = "error not found";
          handler.event.body.Status = "User Event Created and Mail send also";
        } catch (err) {
          handler.event.body.Status = "User Created Error in Email Sending";
          handler.event.body.statusCode = 401;
          handler.event.body.error = "error  found " + error;
        }
      },
    };
  } catch (error) {
    console.log("err", error);
    handler.event.body.Status = "Not able to create Event ";
    handler.event.body.statusCode = 500;
    handler.event.body.error = "error  found " + error;
  }
};

exports.CreateEvent = () => {
  try {
    return {
      before: async (handler, next) => {
        console.log(" the validated option ", typeof handler.event.body);
        console.log("parse calling ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        let validate_token = JWT.validateToken(handler);

        if (validate_token) {
          const uri = process.env.DB_URI;
          await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
          let sendata = {};
          console.log("DB connected ");
          sendata = await createUser.findOne({
            $and: [{ Email: handler.event.body.Email }],
          });
          console.log(
            " API Call get data ",
            sendata,
            "for =>",
            handler.event.body.Email
          );
          if (sendata) {
            let imageData = [];
            imageData = handler.event.body.Image;
            imageData = await creatImageArray(imageData);
            console.log(" get image after all image iterate");
            console.log(" get data imageData", imageData);
            // let eventcreated = new EventCreate({
            //   Name: handler.event.body.Name,
            //   Email: imageData,
            // });
            console.log(
              await EventCreate.insertMany({
                Name: handler.event.body.Name,
                Image: imageData,
              })
            );
            // console.log("  eventcreated @@@@", eventcreated);
            // let getdata = await eventcreated.ins();

            // console.log("  data from user @@@@", getdata);
            handler.event.body.statusCode = 200;
            handler.event.body.error = "error not found";
            handler.event.body.Status = "Authorise Sucess";
            handler.event.body.data = "data save all";
          } else {
            console.log("no data with this email id ");
            handler.event.body.Status = "no data found";
            handler.event.body.statusCode = 401;
            handler.event.body.error = "error not found";
          }
        } else {
          console.log("err");
          handler.event.body.Status = "unAunothorise";
          handler.event.body.statusCode = 500;
          handler.event.body.validate = false;
        }
      },
    };
  } catch (error) {
    console.log("err", error);
    handler.event.body.Status = "unAunothorise";
    handler.event.body.statusCode = 500;
    handler.event.body.error = "error  found " + error;
  }
};

exports.CreateService = () => {
  try {
    return {
      before: async (handler, next) => {
        console.log(" the validated option ", typeof handler.event.body);
        console.log("parse calling ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        let validate_token = JWT.validateToken(handler);

        if (validate_token) {
          const uri = process.env.DB_URI;
          await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
          let sendata = {};
          console.log("DB connected ");
          sendata = await createUser.findOne({
            $and: [{ Email: handler.event.body.Email }],
          });
          console.log(
            " API Call get data ",
            sendata,
            "for =>",
            handler.event.body.Email
          );
          if (sendata) {
            console.log("has admin write ");
            console.log(
              await CreateService.insertMany(handler.event.body.data)
            );
            handler.event.body.statusCode = 200;
            handler.event.body.error = "error not found";
            handler.event.body.Status = "Authorise Sucess";
            handler.event.body.data = "data save all";
          } else {
            console.log("no data with this email id ");
            handler.event.body.Status = "no data found";
            handler.event.body.statusCode = 401;
            handler.event.body.error = "error not found";
          }
        } else {
          console.log("err");
          handler.event.body.Status = "unAunothorise";
          handler.event.body.statusCode = 500;
          handler.event.body.validate = false;
        }
      },
    };
  } catch (error) {
    console.log("err", error);
    handler.event.body.Status = "unAunothorise";
    handler.event.body.statusCode = 500;
    handler.event.body.error = "error  found " + error;
  }
};

exports.getAllEvent = () => {
  try {
    return {
      before: async (handler, next) => {
        // handler.event = JSON.parse(handler.event)
        const uri = process.env.DB_URI;
        console.log(" response data ", handler.event);
        console.log(" type data ", typeof handler.event);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

        let senddata = await EventCreate.find();
        console.log(" get data from user", senddata);
        let makedata = senddata;
        makedata.ImageData = [];
        let ImageDataget = [];
        console.log(" beofre operation ", makedata);
        for (let i = 0; i < senddata.length; i++) {
          ImageDataget.push(await getAllImage(senddata[i].Image));
        }
        for (let i = 0; i < makedata.length; i++) {
          makedata[i].Image = ImageDataget[i];
        }

        console.log("after all operation ", makedata);
        console.log("after all  array imagedata ", ImageDataget);

        handler.event.statusCode = 200;
        handler.event.error = "error not found";
        handler.event.Status = "Authorise Sucess";
        // senddata.push(ImageDataget)
        // handler.event.data={
        //   "senddata":senddata,
        //   "ImageBuufer":ImageDataget
        // }
        handler.event.data = makedata;
      },
    };
  } catch (error) {
    console.log("err", error);

    handler.event.Status = "unAunothorise";
    handler.event.statusCode = 500;
    handler.event.error = "error  found " + error;
  }
};

exports.getAllCreateService = () => {
  try {
    return {
      before: async (handler, next) => {
        // handler.event = JSON.parse(handler.event)
        const uri = process.env.DB_URI;
        console.log(" response data ", handler.event);
        console.log(" type data ", typeof handler.event);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

        let senddata = await CreateService.find();
        console.log("get data from CreateService", senddata);
        handler.event.statusCode = 200;
        handler.event.error = "error not found";
        handler.event.Status = "Authorise Sucess";
        handler.event.data = senddata;
      },
    };
  } catch (error) {
    console.log("err", error);
    handler.event.Status = "unAunothorise";
    handler.event.statusCode = 500;
    handler.event.error = "error  found " + error;
  }
};

async function creatImageArray(imageArray) {
  let uploadImage = [];
  for (let i = 0; i < imageArray.length; i++) {
    try {
      let id_image = uuid.v4();
      const body = Buffer.from(imageArray[i], "base64");
      uploadImage[i] = await upload.uploadfile(body, id_image);
      console.log(" in the loop image save ");
    } catch (err) {
      uploadImage[i] = "";
      console.log(" in the loop image not save  ");
      console.log(" error ", err);
    }
  }
  return uploadImage;
}

async function getAllImage(imageArray) {
  let uploadImage = [];

  console.log(" the Image key ", imageArray);
  for (let i = 0; i < imageArray.length; i++) {
    try {
      data = await getfile.getfile(imageArray[i]);
      let url = `https://s3.amazonaws.com/${constant.S3BucketName}/${imageArray[i]}`;
      uploadImage.push(url);
      //  uploadImage.push(data)
      console.log(" get image ");
    } catch (err) {
      uploadImage.push("");
      console.log(" not get image  ");
      console.log(" error ", err);
    }
  }
  return uploadImage;
}
