// const DB_Handler=required(")
const db = require("../DB_Handler/DB_handler");
const createUser = require("../Model/signup");
const WebinarRequest=require('../Model/webinarRequest')
const Email=require('../Utlities/mail_Helper')

const JWT = require("../Utlities/util");
exports.Signup = async (data) => {
  const login = new createUser({
    Email: data.email_id,
    Password: data.Password,
    PhoneNumber: data.PhoneNumber,
    DOB: data.DOB,
    PROFILE: data.Role,
  });
  login
    .save()
    .then(() => {
      console.log("User created");
      return { status: "Data is save" };
    })
    .catch((err) => {
      console.log(err);
      return err;
    });
};

exports.login = async (data) => {
  try {
    let sendata = {};
    sendata.info = await createUser.findOne({
      $and: [{ Email: data.email_id }, { Password: data.Password }],
    });
    if (sendata.info) {
      sendata.token = await JWT.GenrateToken(data.email_id);
      sendata.Status = "Authorise Sucess";
      return sendata;
    } else {
      return (sendata.Status = "Aunothorise");
    }
  } catch (err) {
    throw err;
  }
};

exports.getProfile = async (data) => {
  try {
    let sendata = {};
    sendata.info = await createUser.findOne({
      $and: [{ Email: data.email_id }],
    });
    if (sendata.info) {
      sendata.Status = "Authorise Sucess";
      return sendata;
    } else {
      return (sendata.Status = "Aunothorise");
    }
  } catch (err) {
    throw err;
  }
};

exports.WebinarRequest=async(data)=>{
  try{
    const webinarRequest=new WebinarRequest({
      Name:data.name,
      Email:data.email,
      PhoneNumber:data.phonenumber,
      Address:data.address,
      pincode:data.pincode,
      Date:data.date
    })

    await webinarRequest.save()
   try{
    Email.mailSender(data)
   }
   catch(err)
   {
    throw new Error("Error in sending Email")
   }
  }catch(err)
  {
    throw err;
  }
}
