// const DB_Handler=required(")
const validateToken = require("../middleware/util");
const createUser = require("../Model/signup");
const WebinarRequest = require("../Model/webinarRequest");
const upload = require("../middleware/uploadfile");
const mongoose = require("mongoose");
require("dotenv").config();
const uuid = require("uuid");
const jwt = require("jsonwebtoken");
const JWT = require("../middleware/util");

exports.signup = () => {
  try {
    return {
      before: async (handler, next) => {
        const uri = process.env.DB_URI;
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        await createUser.createIndexes(
          { Email: 1 },
          { expireAfterSeconds: 10 }
        );
        console.log("signup data ", typeof handler.event.body);
        console.log("parse ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        let data = await createUser.findOne({
          Email: handler.event.body.email,
        });
        let id_image = uuid.v4();
        console.log(" user present ", data);
        if (data) {
          handler.event.body.Status = "user already Exits ";
          handler.event.body.error = "error not found";
          console.log(" found");
          handler.event.body.statusCode = 409;
        } else {
          console.log("user not present");

          // let upload_filed_data = await upload.uploadfile(body, id_image);
          if (handler.event.body.image) {
            try {
              const body = Buffer.from(handler.event.body.image, "base64");
              let imagedata = await upload.uploadfile(body, id_image);
              let signup = new createUser({
                Email: handler.event.body.email,
                Password: handler.event.body.Password,
                PhoneNumber: handler.event.body.PhoneNumber,
                DOB: handler.event.body.DOB,
                PROFILE: handler.event.body.Role,
                Image: imagedata,
              });

              await signup.save();

              handler.event.body.Status =
                "user data created and image save also";
            } catch (err) {
              const signup = new createUser({
                Email: handler.event.body.email,
                Password: handler.event.body.Password,
                PhoneNumber: handler.event.body.PhoneNumber,
                DOB: handler.event.body.DOB,
                PROFILE: handler.event.body.Role,
                Image: "",
              });
              await signup.save();

              handler.event.body.Status = "user data created and " + err;
              throw err;
            }
          } else {
            const signup = new createUser({
              Email: handler.event.body.email,
              Password: handler.event.body.Password,
              PhoneNumber: handler.event.body.PhoneNumber,
              DOB: handler.event.body.DOB,
              PROFILE: handler.event.body.Role,
              Image: "",
            });
            await signup.save();
            handler.event.body.Status = "user data created";
          }

          handler.event.body.statusCode = 200;
          handler.event.body.error = "error not found";
        }
      },
    };
  } catch (error) {
    handler.event.body.error = "Error While Creating User " + error;
    handler.event.body.Status = "unAunothorise";
    handler.event.body.statusCode = 500;
    handler.event.body.error = "error  found " + error;
  }
};

exports.login = () => {
  try {
    return {
      before: async (handler, next) => {
        const uri = process.env.DB_URI;
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("signin data ", typeof handler.event.body);
        console.log("parse ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        await createUser.createIndexes(
          { Email: 1 },
          { expireAfterSeconds: 10 }
        );
        console.log("index created");

        let sendata = await createUser.findOne({
          $and: [
            { Email: handler.event.body.email },
            { Password: handler.event.body.Password },
          ],
        });

        mongoose.disconnect();
        console.log(" get data ", sendata);
        if (sendata) {
          handler.event.body.token = await JWT.GenrateToken(
            handler.event.body.email
          );
          handler.event.body.statusCode = 200;
          handler.event.body.error = "error not found";
          handler.event.body.Status = "login successfull";
          console.log("pass to login");
        } else {
          handler.event.body.Status = "unAunothorise";
          handler.event.body.statusCode = 401;
          handler.event.body.error = "error not found";
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

exports.getProfile = () => {
  try {
    return {
      before: async (handler, next) => {
        console.log(" the validated option ", typeof handler.event.body);
        console.log("parse calling ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        // let jwtSecretKey = process.env.JWT_SECRET_KEY;

        // Token = handler.event.headers.authorization.split(" ");
        // const verified = jwt.verify(Token[1], jwtSecretKey);
        let validate_token = JWT.validateToken(handler);
        //  let  validated=await validateToken(handler)
        if (validate_token) {
          console.log("in the get profile");
          const uri = process.env.DB_URI;

          await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
          let sendata = {};
          console.log("DB connected ");
          sendata = await createUser.findOne({
            $and: [{ Email: handler.event.body.email }],
          });
          console.log(
            " API Call get data ",
            sendata,
            "for =>",
            handler.event.body.email
          );
          if (sendata) {
            console.log(" get data from user", sendata);
            handler.event.body.statusCode = 200;
            handler.event.body.error = "error not found";
            handler.event.body.Status = "Authorise Sucess";
            handler.event.body.data = sendata;
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

exports.updateProfile = () => {
  try {
    return {
      before: async (handler, next) => {
        console.log(" the validated option ", typeof handler.event.body);
        console.log("parse calling ", JSON.parse(handler.event.body));
        handler.event.body = JSON.parse(handler.event.body);
        // let jwtSecretKey = process.env.JWT_SECRET_KEY;

        // Token = handler.event.headers.authorization.split(" ");
        // const verified = jwt.verify(Token[1], jwtSecretKey);
        let validate_token = JWT.validateToken(handler);
        //  let  validated=await validateToken(handler)
        if (validate_token) {
          console.log("in the get profile");
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
            let updateData = handler.event.body;
            await createUser.updateOne(
              {
                Email: handler.event.body.Email,
              },
              { $set: updateData }
            );
            console.log(" get data from user", sendata);
            handler.event.body.statusCode = 200;
            handler.event.body.error = "error not found";
            handler.event.body.Status = "Authorise Sucess";
            handler.event.body.data = sendata;
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

exports.getAllUser = () => {
  try {
    return {
      before: async (handler, next) => {
        // handler.event = JSON.parse(handler.event)
        const uri = process.env.DB_URI;
        console.log(" response data ", handler.event);
        console.log(" type data ", typeof handler.event);
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        await createUser.createIndexes(
          { PROFILE: 1 },
          { expireAfterSeconds: 10 }
        );
        let senddata = await createUser.find({ PROFILE: "Student" });

        console.log("DB connected ");

        console.log(" get data from user", senddata);
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

// exports.WebinarRequest=async(data)=>{
//   try{
//     const webinarRequest=new WebinarRequest({
//       Name:data.name,
//       Email:data.email,
//       PhoneNumber:data.phonenumber,
//       Address:data.address,
//       pincode:data.pincode,
//       Date:data.date
//     })

//     await webinarRequest.save()
//    try{
//     Email.mailSender(data)
//    }
//    catch(err)
//    {
//     throw new Error("Error in sending Email")
//    }
//   }catch(err)
//   {
//     throw err;
//   }
// }
