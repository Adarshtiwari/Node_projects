/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-absolute-path */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
const { uuid } = require('uuidv4');
const util = require('../../../lib/util');
const utilLayer = require('/opt/custom_modules/util');
const constant = require('../../../lib/constants');
const dynamobdHelper = require('../../../lib/dynamodb-helper');

async function newUserMapping(inputData) {
  const userId = `${constant.userType[inputData.userType]}#${uuid()}`;
  const { password } = inputData;
  const hashedPassword = await utilLayer.encryptData(password);

  const user = {
    id: userId,
    firstName: inputData.firstName,
    lastName: inputData.lastName,
    phoneNumber: inputData.phoneNumber,
    email: inputData.email,
    userType: inputData.userType,
    address: inputData.address,

  };
  user.password = await hashedPassword;
  if (inputData.userType === constant.userType.DeliveryBoy) {
    user.deliveryBoyStatus = constant.deliveryBoyStatus.Available;
  }
  return user;
}

function updateUserMapping(inputData) {
  const user = inputData;
  user.id = inputData.userId;
  delete user.userId;
  return user;
}

async function deleteUser(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('deleteUser', inputData, request, constant.logstate.initial, logid, null);

  let result;
  let user = {};
  try {
    result = await dynamobdHelper.getUserByUserId(inputData.userId);
    await util.writeToCloudWatch('Fetching user details by id', result, request, constant.logstate.success, logid, null);
  } catch (error) {
    await util.writeToCloudWatch('Error while fetching user details', null, request, constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
  if (!result.Count) {
    return Promise.reject(new Error('Invalid userId'));
  }
  user = result.Items[0];
  user.userId = user.id;
  delete user.id;

  try {
    await dynamobdHelper.deleteUser(inputData.userId);
    await util.writeToCloudWatch('Deleting user details', null, request, constant.logstate.success, logid, null);
    return Promise.resolve(user);
  } catch (e) {
    await util.writeToCloudWatch('Error while deleting user details', null, request, constant.logstate.failure, logid, e);
    return Promise.reject(e);
  }
}
/**
 * This method is responsible for getting user details
 * @returns it should return user object
 */
async function getUser(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('getUser', inputData, request, constant.logstate.initial, logid, null);
  let user = {};
  let result;
  try {
    result = await dynamobdHelper.getUserByUserId(inputData.userId);
    await util.writeToCloudWatch('Fetching user details by id', result, request, constant.logstate.success, logid, null);
  } catch (error) {
    await util.writeToCloudWatch('Error while fetching user details', null, request, constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
  if (!result.Count) {
    return Promise.reject(new Error('Invalid userId'));
  }
  user = result.Items[0];
  user.userId = user.id;
  delete user.id;

  return Promise.resolve(user);
}

async function createUser(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('createUser', inputData, request, constant.logstate.initial, logid, null);

  let newUser;
  let isUserExist;
  try {
    newUser = await newUserMapping(inputData);
  } catch (e) {
    return Promise.reject(e);
  }

  try {
    // validating email already exists or not.
    isUserExist = await dynamobdHelper.getUserByEmailId(inputData.email);
    await util.writeToCloudWatch('Fetching user details by email id', isUserExist, request, constant.logstate.success, logid, null);
    if (isUserExist.length) {
      return Promise.reject(new Error('User already exists'));
    }
  } catch (error) {
    await util.writeToCloudWatch('Error while fetching user details', null, request, constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
  try {
    if (newUser) {
      const result = await dynamobdHelper.writeUser(newUser);
      await util.writeToCloudWatch('Saving user details', result, request, constant.logstate.success, logid, null);

      if (newUser.userType === constant.userType.User) {
        const demo = uuid();
        const cartid = `CART#${demo}`;
        const sk = `#CART#${demo}`;

        const newCart = {
          id: cartid,
          sortKey: sk,
          userId: newUser.id,
        };
        const cartoutput = await dynamobdHelper.createCart(newCart, request);
        await util.writeToCloudWatch('Saving cart detials', cartoutput, request, constant.logstate.success, logid, null);
      }
    }
  } catch (e) {
    await util.writeToCloudWatch('Error while saving user details or cart details', null, request, constant.logstate.failure, logid, e);
    return Promise.reject(e);
  }
  newUser.userId = newUser.id;

  delete newUser.id;
  return Promise.resolve(newUser);
}

async function updateUser(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('updateUser', inputData, request, constant.logstate.initial, logid, null);

  let updatedUser;
  let user;
  try {
    user = updateUserMapping(inputData);
    updatedUser = await dynamobdHelper.updateUser(user);
    await util.writeToCloudWatch('Updating user details', updateUser, request, constant.logstate.success, logid, null);
    if (!updatedUser.Attributes) {
      return Promise.reject(new Error('Invalid UserId'));
    }
    user = updatedUser.Attributes;
    user.userId = updatedUser.Attributes.id;
    delete user.id;
    return Promise.resolve(user);
  } catch (e) {
    await util.writeToCloudWatch('Error while updating user details', null, request, constant.logstate.failure, logid, e);
    return Promise.reject(e);
  }
}

async function getUserList(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('getUserList', inputData, request, constant.logstate.initial, logid, null);

  let UserList = [];
  const element = [];
  try {
    UserList = await dynamobdHelper.getUserList(true);
    await util.writeToCloudWatch('Fetching user list details', UserList, request, constant.logstate.success, logid, null);
    for (let index = 0; index < UserList.length; index += 1) {
      element[index] = UserList[index];
      element[index].userId = UserList[index].id;
      delete element[index].id;
    }
    return Promise.resolve(element);
  } catch (e) {
    await util.writeToCloudWatch('Error while fetching user list details', null, request, constant.logstate.initial, logid, e);
    return Promise.reject(e);
  }
}

async function userLogin(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('userLogin', inputData, request, constant.logstate.initial, logid, null);

  try {
    const user = await dynamobdHelper.userLogin(inputData);
    await util.writeToCloudWatch('Calling user login method', user, request, constant.logstate.success, logid, null);
    if (user.Items.length) {
      const { password } = user.Items[0];
      const hashedPassword = await utilLayer.decryptData(password, inputData.password);
      await util.writeToCloudWatch('Calling decryptDate method', hashedPassword, request, constant.logstate.success, logid, null);
      if (hashedPassword) {
        user.Items[0].userId = user.Items[0].id;
        delete user.Items[0].id;
        try {
          const jwtToken = utilLayer.generateJWT(user.Items[0], constant.keys.JWTSecreteKey);
          user.Items[0].jwtToken = jwtToken;
          return Promise.resolve(user.Items[0]);
        } catch (error) {
          return Promise.reject(error);
        }
      }
      await util.writeToCloudWatch('Error while user login', null, request, constant.logstate.failure, logid, 'Incorrect Password');
      return Promise.reject(new Error('Incorrect Password'));
    }
    await util.writeToCloudWatch('Error while user login', null, request, constant.logstate.failure, logid, 'Invalid User');
    return Promise.reject(new Error('Invalid User'));
  } catch (error) {
    await util.writeToCloudWatch('Error while user login', null, request, constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
}

async function listDeliveryBoy(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('listDeliveryBoy', inputData, request, constant.logstate.initial, logid, null);

  const totalUsers = [];
  let result;

  try {
    result = await dynamobdHelper.getDeliveryBoys();
    await util.writeToCloudWatch('Fetching delivery boys', result, request, constant.logstate.success, logid, null);
  } catch (error) {
    await util.writeToCloudWatch('Error while Fetching delivery boys', inputData, request, constant.logstate.success, logid, error);
    return Promise.reject(error);
  }

  // mapping user id
  result.forEach((element) => {
    const user = element;
    user.userId = element.id;
    delete user.id;
    totalUsers.push(user);
    // return element;
  });
  return Promise.resolve(totalUsers);
}

module.exports = {
  deleteUser,
  getUser,
  createUser,
  updateUser,
  getUserList,
  userLogin,
  listDeliveryBoy,
};
