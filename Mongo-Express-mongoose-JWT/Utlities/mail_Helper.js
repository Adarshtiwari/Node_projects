
const nodemailer = require('nodemailer');
const constant= require("../Constant")
require('dotenv').config()
const Admin_Email = process.env.Admin_Email;  
const Admin_Email_Password = process.env.Admin_Email_Password;

console.log(" the admin mail ",Admin_Email)
let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: Admin_Email,
        pass: Admin_Email_Password
    }
});
 

exports.mailSender=(data)=>{
    
    let mailDetails = {
        from: data.Email,
        to: Admin_Email,
        subject: constant.WebinarNotification,
        text: `You have received the Webinar request from ${data.Email}  mobile number is ${data.PhoneNumber} `
    };

    console.log(" the mail details",mailDetails)
    console.log("user pass",Admin_Email,Admin_Email_Password)
    mailTransporter.sendMail(mailDetails, function(err, data) {
        if(err) {
           throw err
        } else {
            return ({status_Email:true,error:"not found" })
        }
    });
   
 
}