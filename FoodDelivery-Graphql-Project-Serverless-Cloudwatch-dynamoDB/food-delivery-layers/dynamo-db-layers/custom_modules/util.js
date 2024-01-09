const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const jwt = require('jsonwebtoken');
const request = require('request').defaults({ encoding: null });
const isBase64 = require('is-base64');
const Pusher = require('pusher');

const saltRounds = 10;

module.exports.encryptData = async (data) => {
  try {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(data, salt);
    return Promise.resolve(hash);
  } catch (error) {
    
    return Promise.reject(error);
  }
};

module.exports.decryptData = async (hashedPassword, inputData) => {
  try {
    const isAuthorized = bcrypt.compareSync(inputData, hashedPassword);
    return Promise.resolve(isAuthorized);
  } catch (error) {
  
    return Promise.reject(error);
  }
};

module.exports.base64ToJson = async (base64String) => {
  const data = [];

  try {
    const bufferObj = Buffer.from(base64String, 'base64');
    // var workbook = XLSX.readFile(bufferObj.toString(), {type:"base64"});
    const workbook = XLSX.read(bufferObj);

    const sheet_name_list = workbook.SheetNames;
    // fs.unlinkSync('./excel.xlsx')
    sheet_name_list.forEach((y) => {
      const worksheet = workbook.Sheets[y];
      const headers = {};
      for (const z in worksheet) {
        if (z[0] === '!') continue;
        // parse out the column, row, and value
        const col = z.substring(0, 1);
        const row = parseInt(z.substring(1));
        const value = worksheet[z].v;
        // store header names
        if (row == 1) {
          headers[col] = value;
          continue;
        }

      
        if (!data[row]) data[row] = {};
        // const menuItemId = `#MENUITEM#${uuid()}`;
        data[row][headers[col]] = value;
        // data[row]["id"]=restaurantid;
        // data[row]["sortKey"]=menuItemId;
      }
      // drop those first two rows which are empty
      data.shift();
      data.shift();
   
    });
    return Promise.resolve(data);
  } catch (e) {
  
    return Promise.reject(e);
  }
};

module.exports.isBase64String = (str) => {
  const result = isBase64(str, { allowMime: true });
  return result;
};

module.exports.generateJWT = (user, secretKey) => {
  let token;
  try {
    // Creating jwt token
    token = jwt.sign(
      user,
      secretKey,
      { expiresIn: '1h' },
    );
    return token;
  } catch (err) {
    return err;
  }
};

exports.getBase64ByURL = (url) => new Promise((resolve, reject) => {
  let data;
  request.get(url, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      data = `data:${response.headers['content-type']};base64,${Buffer.from(body).toString('base64')}`;
      resolve(data);
    }
    reject(error);
  });
});

exports.pushNotification = async (channelName, eventName, message) => {
  try {
    const pusher = new Pusher({
      appId: '1382413',
      key: 'c3ebd4428bfc50dfd915',
      secret: '23917677aa7d99866ea3',
      cluster: 'ap2',
      useTLS: true,
    });
    await pusher.trigger(channelName, eventName, message);
    return true;
  } catch (error) {
    return false;
  }
};
