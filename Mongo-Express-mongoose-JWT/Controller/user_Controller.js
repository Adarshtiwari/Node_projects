
const Authservice=require("../Service/Auth_service")

exports.Signup=async (req,res)=>{
try{
    console.log("calling from controller")
    await res.status(200).send(Authservice.Signup(req.body))
}
catch(err)
{
    res.status(401).send({status:"failed to save data",error:err})
}
}

exports.Login=async (req,res)=>{
try{
    console.log("calling from controller")
    // console.log()
    res.status(200).send(await Authservice.login(req.body))
}catch(err)
{
    res.status(401).send({status:"failed to get data",error:err})
}
}

exports.getProfile=async (req,res)=>{
try{
    console.log("calling from controller")
    // console.log()
    res.status(200).send(await Authservice.getProfile(req.body))
}
catch(err)
{
    res.status(401).send({status:"failed to get data",error:err})
}
}

exports.createWebinarRequest=async(req,res)=>{
    try{
     const getRes=await Authservice.WebinarRequest(req.body)
     res.status(200).send(getRes)
    }catch(err)
    {
        res.status(401).send({status:"failed to set data or to send Email ",error:err})
    }
}

exports.uploadDocument=async(req,res)=>{
    try{
        const getRes=await Authservice.WebinarRequest(req.body)
        res.status(200).send(getRes)
       }catch(err)
       {
           res.status(401).send({status:"failed to set data or to send Email ",error:err})
       }
}