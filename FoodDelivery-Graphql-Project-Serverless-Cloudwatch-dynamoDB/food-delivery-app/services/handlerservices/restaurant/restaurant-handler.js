/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
const { uuid } = require("uuidv4");
const dynamobdHelper = require("../../../lib/dynamodb-helper");
const s3Helper = require("../../../lib/s3-helper");
// eslint-disable-next-line import/no-absolute-path
const layerUtil = require("/opt/custom_modules/util");
const Constant = require("../../../lib/constants");
const util = require("../../../lib/util");

// new restaurant mapping
function newRestaurantMapping(inputData) {
  const restaurantId = Math.floor(100000 + Math.random() * 900000);
  let Rating = {
    sum: 0,
    currentRating: 0.0,
    totalNumberOfUser: 0,
  };
  const restaurant = {
    id: `REST#${restaurantId}`,
    sortKey: `#REST#${restaurantId}`,
    restaurantName: inputData.restaurantName,
    category: inputData.category,
    address: inputData.address,
    userId: inputData.userId,
    rating: Rating,
  };
  return restaurant;
}

// update restaurant mapping
function updateRestaurantMapping(inputData) {
  const restaurantData = {
    id: inputData.id,
    sortKey: `#${inputData.id}`,
    category: inputData.category,
    address: inputData.address,
    ...inputData,
  };

  return restaurantData;
}

function updateRestaurantRatingMapping(inputData) {
  const restaurantData = {
    id: inputData.id,
    sortKey: `#${inputData.id}`,
    category: inputData.category,
    address: inputData.address,
    rating: inputData.rating,
    ...inputData,
  };

  return restaurantData;
}

async function getRestaurantDetails(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getRestaurantDetails",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let restaurantList = [];

  try {
    restaurantList = await dynamobdHelper.getRestaurantDetails(
      inputData.restaurantID,
      true
    );
    await util.writeToCloudWatch(
      "Fetching restaurant details",
      restaurantList,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  const restaurantDetails = restaurantList.Items[0];

  return Promise.resolve(restaurantDetails);
}

// create Restaurant
async function createRestaurant(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "createRestaurant",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let newRestaurant;
  let image;

  try {
    // validating userId
    const isValidUser = await dynamobdHelper.getUserByUserId(inputData.userId);
    await util.writeToCloudWatch(
      "Fetching user details by id",
      isValidUser,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!isValidUser.Count) {
      return Promise.reject(new Error("Invalid userId"));
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching user details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(new Error(error));
  }
  try {
    newRestaurant = newRestaurantMapping(inputData);
  } catch (e) {
    return Promise.reject(e);
  }

  if (Object.prototype.hasOwnProperty.call(inputData, "image")) {
    const isValidBase64String = await layerUtil.isBase64String(inputData.image);
    await util.writeToCloudWatch(
      "Validating base64 string",
      isValidBase64String,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    // validating if base64 string is valid or not
    if (!isValidBase64String) {
      await util.writeToCloudWatch(
        "Validatin base64 string",
        null,
        request,
        Constant.logstate.failure,
        logid,
        "Invalid base64 string"
      );
      return Promise.reject(new Error("Invalid base64 string"));
    }
    try {
      const base64 = inputData.image;
      const key = `${newRestaurant.id}`;
      // saving image in aws s3 bucket
      image = await s3Helper.saveToS3(key, base64);
      await util.writeToCloudWatch(
        "Saving base64 on S3 bucket",
        image,
        request,
        Constant.logstate.success,
        logid,
        null
      );
      newRestaurant.image = image.Location;
    } catch (error) {
      await util.writeToCloudWatch(
        "Error while saving base64 on S3",
        null,
        request,
        Constant.logstate.failure,
        logid,
        error
      );
      return Promise.reject(new Error("Error while saving image in AWS S3"));
    }
  }

  try {
    await dynamobdHelper.writeRestaurant(newRestaurant);
    await util.writeToCloudWatch(
      "Saving restaurant details",
      null,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while saving restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  return Promise.resolve(newRestaurant);
}

// list restaurants
async function getRestaurantList(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getRestaurantList",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );
  let result = [];
  const restaurantList = [];
  try {
    result = await dynamobdHelper.getRestaurantList(true);
    await util.writeToCloudWatch(
      "Fetching restaurant list",
      result,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant list",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  result.map((element) => {
    const restId = `#${element.id}`;
    if (restId === element.sortKey) {
      restaurantList.push(element);
    }
    return element;
  });
  return Promise.resolve(restaurantList);
}

// get restaurant by id
async function getRestaurantById(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getRestaurantById",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let restaurantList;
  try {
    restaurantList = await dynamobdHelper.getRestaurantById(inputData.id);
    await util.writeToCloudWatch(
      "Fetching restaurant details",
      inputData,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  return Promise.resolve(restaurantList);
}

// update Restaurant
async function updateRestaurant(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "updateRestaurant",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let updatedRestaurant = {};
  let Updresult;
  updatedRestaurant = await updateRestaurantMapping(inputData);

  try {
    const updateResult = await dynamobdHelper.updateRestaurant(
      updatedRestaurant
    );
    await util.writeToCloudWatch(
      "Updating restaurant details",
      updateResult,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (updateResult.Attributes) {
      Updresult = updateResult.Attributes;
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while updating restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  return Promise.resolve(Updresult);
}

// delete restaurant
async function deleteRestaurant(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "deleteRestaurant",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let restaurant;

  // Get Restaurant details
  try {
    restaurant = await dynamobdHelper.deleteRestaurant(inputData.id);
    await util.writeToCloudWatch(
      "Deleting restaurant details",
      null,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    return Promise.resolve(restaurant);
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while deleting restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
}

// get restaurant by userid
async function getRestaurantByUserId(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getRestaurantByUserId",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let restaurantList;
  try {
    restaurantList = await dynamobdHelper.getRestaurantByUserId(
      inputData.userId
    );
    await util.writeToCloudWatch(
      "Fetching restaurant details by user id",
      restaurantList,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  return Promise.resolve(restaurantList[0]);
}

async function filterQuerryOnRestaurant(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "filterQuerryOnRestaurant",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );
  let result = [];
  const restaurantList = [];
  try {
    result = await dynamobdHelper.filterQuerryOnRestaurant(inputData.input);
    await util.writeToCloudWatch(
      "Fetching restaurant list",
      result,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant list",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  result.Items.forEach((element) => {
    let restaurant = {};
    restaurant = element;
    restaurant.restaurantId = element.id;
    // delete restaurant.id;
    // delete restaurant.sortKey;
    restaurantList.push(restaurant);
  });

  return Promise.resolve(restaurantList);
}

async function updateRestaurantRating(inputData) {
  await util.writeToCloudWatch(
    "updateRestaurantRating",
    inputData,
    Constant.logstate.initial,
    null
  );

  let restaurantList;
  //  let sum=0;
  let currentRating = 0;
  let numberOfUser = 0;
  let Updresult;

  try {
    restaurantList = await dynamobdHelper.getRestaurantById(
      inputData.restaurantId
    );

    let sum = restaurantList.rating.sum;
    currentRating = restaurantList.rating.currentRating;
    numberOfUser = restaurantList.rating.totalNumberOfUser;

    if (currentRating != 0) {
      restaurantList.rating.sum = sum + inputData.userRating;
      restaurantList.rating.totalNumberOfUser =
        restaurantList.rating.totalNumberOfUser + 1;
      restaurantList.rating.currentRating = sum / numberOfUser;
    } else {
      restaurantList.rating.sum = inputData.userRating;
      restaurantList.rating.totalNumberOfUser = 1;
      restaurantList.rating.currentRating = inputData.userRating;
    }
    await util.writeToCloudWatch(
      "Fetching restaurant details",
      inputData,
      Constant.logstate.success,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant details",
      null,
      Constant.logstate.failure,
      e
    );
    return Promise.reject(e);
  }
  const updatedRestaurant = await updateRestaurantRatingMapping(restaurantList);

  try {
    const updateResult = await dynamobdHelper.updateRestaurant(
      updatedRestaurant
    );
    await util.writeToCloudWatch(
      "Updating restaurant details",
      updateResult,
      Constant.logstate.success,
      null
    );
    if (updateResult.Attributes) {
      Updresult = updateResult.Attributes;
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while updating restaurant rating details",
      null,
      Constant.logstate.failure,
      e
    );
    return Promise.reject(e);
  }
  return Promise.resolve(Updresult);
}

async function getRestaurantDetailsByIndex(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "RestaurantDetailsByIndex",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let result = [];
  const restaurantList = [];
  try {
    result = await dynamobdHelper.getRestaurantDetailsByIndex(inputData.input);

    await util.writeToCloudWatch(
      "Fetching orderitem list",
      result,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching orderitem list",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  result.Items.forEach((element) => {
    let restaurant = {};
    restaurant = element;
    restaurant.restaurantId = element.id;
    restaurant.menuItemId = element.sortKey;
    delete result.sortKey;
    // delete restaurant.id;
    // delete restaurant.sortKey;
    restaurantList.push(restaurant);
  });

  return Promise.resolve(restaurantList);
}

module.exports = {
  createRestaurant,
  getRestaurantDetails,
  getRestaurantList,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantByUserId,
  filterQuerryOnRestaurant,
  updateRestaurantRating,
  getRestaurantDetailsByIndex,
};
