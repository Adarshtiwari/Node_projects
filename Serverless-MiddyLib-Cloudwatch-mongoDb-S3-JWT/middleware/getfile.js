const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const constant = require("../constant");

exports.getfile = async (UUid) => {
  const params = {
    Bucket: constant.S3BucketName,
    Key: `${UUid}`,
  };
  try {
    console.log(" in the upload file");
    let data=await s3.getObject(params).promise();
    // return data.Body.toString('utf-8'); 
    const encodedImage =data.Body.toString('base64')
    
    return encodedImage;

ta;
  } catch (error) {
    console.log("Error uploading file to S3:", error);
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};
// return `https://eventwebsiteimages.s3.amazonaws.com/475a513c-5155-4018-8d8f-98184025633e`;
// https://s3.amazonaws.com/eventwebsiteimages/c3d21c88-6197-4b20-89e0-e6db04fc3e42