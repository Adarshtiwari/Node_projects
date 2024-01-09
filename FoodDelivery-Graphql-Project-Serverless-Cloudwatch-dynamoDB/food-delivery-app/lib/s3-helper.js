/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
const AWS = require('aws-sdk');
const constant = require('./constants');

AWS.config.update({ region: 'us-east-1' });
const s3 = new AWS.S3();

// This method is responsible for saving file to S3 bucket
module.exports.saveToS3 = async (key, base64) => new Promise((resolve, reject) => {
  // eslint-disable-next-line new-cap
  const base64Data = new Buffer.from(base64.replace(/^data:image\/\w+;base64,/, ''), 'base64');

  // Getting the file type, ie: jpeg, png or gif
  const type = base64.split(';')[0].split('/')[1];

  const { bucketName } = constant.bucketName;

  // creating params
  const params = {
    Bucket: bucketName,
    Key: `${key}.${type}`,
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64',
    ContentType: `image/${type}`,
  };

  // method calling for saving base64 to s3 bucket
  s3.upload(params, (err, res) => {
    if (!err) {
      resolve(res);
    } else {
      reject(err);
    }
  });
});
