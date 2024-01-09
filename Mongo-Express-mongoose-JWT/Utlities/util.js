const jwt = require('jsonwebtoken'); 

exports.GenrateToken=(email_id)=>{
    let jwtSecretKey = process.env.JWT_SECRET_KEY; 
    let data = { 
        time: Date(), 
        userId: email_id, 
    } 
  
    const token = jwt.sign(data, jwtSecretKey); 
  
    return (token);
}

exports.validateToken=(req, res,next) => { 
    // Tokens are generally passed in the header of the request 
    // Due to security reasons. 
  
    let jwtSecretKey = process.env.JWT_SECRET_KEY; 
    Token=req.header('authorization').split(" ");
    try { 
     
  
        const verified = jwt.verify(Token[1], jwtSecretKey); 
        if(verified){ 
            // return res.send("Successfully Verified"); 
            next()
        }else{ 
            // Access Denied 
            return res.status(401).send(error); 
        } 
    } catch (error) { 
        // Access Denied 
        return res.status(401).send(error); 
    } 
} 