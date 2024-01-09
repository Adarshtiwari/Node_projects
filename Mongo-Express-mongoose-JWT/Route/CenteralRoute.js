const express=require("express")
const Auth=require("../Controller/user_Controller")
const JWT=require('../Utlities/util')
const AuthRoute=express.Router();
const upload=require("../Utlities/file_Upload")
const file_Upload=require("../Utlities/file_Upload")

AuthRoute.post('/signup',Auth.Signup)
AuthRoute.get('/login',Auth.Login)
AuthRoute.get('/getProfile',JWT.validateToken,Auth.getProfile)
AuthRoute.post('/webinarRequest',JWT.validateToken,Auth.createWebinarRequest)
AuthRoute.post('/upload',JWT.validateToken,file_Upload.upload.single('file'),(req,res)=>{
    res.json({file:req.file})
})
  
module.exports=AuthRoute



