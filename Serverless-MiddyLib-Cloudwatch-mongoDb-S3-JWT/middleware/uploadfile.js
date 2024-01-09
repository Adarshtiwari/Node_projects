const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const constant=require("../constant")


exports.uploadfile=async (body,email)=>{
    const params = {
        Bucket: constant.S3BucketName,
        Key: `${email}`,
        Body: body,
        ContentType: 'image/jpeg',
      };
      try {
       console.log(" in the upload file")
        await s3.upload(params).promise();
        console.log("*********File uploaded successfully")
        return (email)

      } catch (error) {
        console.log('Error uploading file to S3:', error)
        console.error('Error uploading file to S3:', error);
       throw error 

      }
}