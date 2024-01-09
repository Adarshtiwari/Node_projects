/* eslint-disable no-param-reassign */
/* eslint-disable import/no-absolute-path */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
const { uuid } = require("uuidv4");
const fs = require("fs");
const dynamobdHelper = require("../../../lib/dynamodb-helper");
const util = require("../../../lib/util");
const layerUtil = require("/opt/custom_modules/util");
const s3Helper = require("../../../lib/s3-helper");
const Constant = require("../../../lib/constants");
const logger = require("../../../lib/logger");

// mapping menu item
function newMenuItemMapping(inputData) {
  const { restaurantId } = inputData;
  const menuItemId = `#MENUITEM#${uuid()}`;
  const restaurant = {};
  restaurant.id = restaurantId;
  restaurant.sortKey = menuItemId;
  restaurant.menuItemName = inputData.menuItemName;
  restaurant.actualPrice = inputData.actualPrice;
  restaurant.discount = inputData.discount;
  restaurant.category = inputData.category;
  restaurant.price =
    inputData.actualPrice - (inputData.actualPrice * inputData.discount) / 100;
  if (inputData.description) {
    restaurant.description = inputData.description;
  }
  return restaurant;
}

// createMenuItem
async function createMenuItem(inputData, request) {
  const startTime = new Date();
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "createMenuItem",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let newMenuItem;
  let restaurantList;
  let image;

  try {
    // validating restaurant id
    restaurantList = await dynamobdHelper.getRestaurantDetails(
      inputData.restaurantId,
      true
    );
    await util.writeToCloudWatch(
      "Fetching restaurant list",
      restaurantList,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!restaurantList.Items.length) {
      return Promise.reject(new Error("Invalid restaurantId"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant detials",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  try {
    newMenuItem = await newMenuItemMapping(inputData);
  } catch (e) {
    return Promise.reject(e);
  }

  if (
    Object.prototype.hasOwnProperty.call(inputData, "image") &&
    inputData.image
  ) {
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
      let base64;
      try {
        // checking if the given image string is a URL or not
        base64 = await layerUtil.getBase64ByURL(inputData.image);
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while validating image string",
          null,
          request,
          Constant.logstate.failure,
          logid,
          "Invalid image string"
        );
        return Promise.reject(new Error("Invalid image"));
      }
      try {
        const key = `${newMenuItem.sortKey}`;
        // saving image in aws s3 bucket
        image = await s3Helper.saveToS3(key, base64);
        newMenuItem.image = image.Location;
        await util.writeToCloudWatch(
          "Saving base64 string to S3 bucket",
          null,
          request,
          Constant.logstate.success,
          logid,
          null
        );
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while saving image in AWS S3",
          null,
          request,
          Constant.logstate.failure,
          logid,
          error
        );
        return Promise.reject(new Error("Error while saving image in AWS S3"));
      }
    } else {
      try {
        const base64 = inputData.image;
        const key = `${newMenuItem.sortKey}`;
        // saving image in aws s3 bucket
        image = await s3Helper.saveToS3(key, base64);
        newMenuItem.image = image.Location;
        await util.writeToCloudWatch(
          "Saving base64 string to S3 bucket",
          null,
          request,
          Constant.logstate.success,
          logid,
          null
        );
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while saving image in AWS S3",
          null,
          request,
          Constant.logstate.failure,
          logid,
          error
        );
        return Promise.reject(new Error("Error while saving image in AWS S3"));
      }
    }

    /**
     * Saving base64 string to dynamoDB
     * Description: The below line is able to perform the saving base64 string to dynamoDB
     * If we don't want to save image to S3 bucket then we have to comment the above else
     * block which is able to save image to S3 bucket and uncomment the below line.
     */
    // newMenuItem.image = inputData.image;
  }
  try {
    // saving menu item in database
    await dynamobdHelper.writeMenuItem(newMenuItem);
    await util.writeToCloudWatch(
      "Saving menu item",
      null,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while saving menu item",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  newMenuItem.menuItemId = newMenuItem.sortKey;
  newMenuItem.restaurantId = newMenuItem.id;
  delete newMenuItem.sortKey;
  delete newMenuItem.id;
  return Promise.resolve(newMenuItem);
}

// getMenuItemsByRestaurantId
async function getMenuItemsByRestaurantId(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getMenuItemsByRestaurantId",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  const menuItemList = [];
  let restaurant;
  try {
    restaurant = await dynamobdHelper.getRestaurantDetails(
      inputData.restaurantId,
      true
    );
    await util.writeToCloudWatch(
      "Saving restaurant details",
      restaurant,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!restaurant.Items.length) {
      return Promise.reject(new Error("Invalid restaurantId"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while saving restaurant",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  restaurant.Items.forEach((element) => {
    let menuItem = {};
    if (element.sortKey !== `#${element.id}`) {
      menuItem = element;
      menuItem.restaurantId = element.id;
      menuItem.menuItemId = element.sortKey;
      delete menuItem.id;
      delete menuItem.sortKey;
      menuItemList.push(menuItem);
    }
  });
  return Promise.resolve(menuItemList);
}

// deleteMenuItem
async function deleteMenuItem(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "deleteMenuItem",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let restaurant;
  try {
    restaurant = await dynamobdHelper.getRestaurantDetails(inputData.id, true);
    await util.writeToCloudWatch(
      "Fetching restaurant details",
      restaurant,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!restaurant.Items.length) {
      return Promise.reject(new Error("Invalid restaurantId"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching restaurant details",
      null,
      request,
      Constant.logstate.success,
      logid,
      e
    );
    return Promise.reject(e);
  }

  try {
    await dynamobdHelper.deleteMenuItem(inputData, true);
    await util.writeToCloudWatch(
      "Deleting menu item",
      null,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while deleting menu item",
      null,
      request,
      Constant.logstate.success,
      logid,
      e
    );
    return Promise.reject(e);
  }

  restaurant.Items[0].restaurantId = restaurant.Items[0].id;
  restaurant.Items[0].menuItemId = restaurant.Items[0].sortKey;
  delete restaurant.Items[0].id;
  delete restaurant.Items[0].sortKey;
  return Promise.resolve(restaurant.Items[0]);
}

// update menu item
async function updateMenuItem(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "updateMenuItem",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let image;
  let updatedMenuItem;

  if (
    Object.prototype.hasOwnProperty.call(inputData, "image") &&
    inputData.image
  ) {
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
      let base64;
      try {
        // checking if the given image string is a URL or not
        base64 = await layerUtil.getBase64ByURL(inputData.image);
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while validating image string",
          null,
          request,
          Constant.logstate.failure,
          logid,
          "Invalid image string"
        );
        return Promise.reject(new Error("Invalid image"));
      }
      try {
        const key = `${inputData.sortKey}`;
        // saving image in aws s3 bucket
        image = await s3Helper.saveToS3(key, base64);
        inputData.image = image.Location;
        await util.writeToCloudWatch(
          "Saving base64 string to S3 bucket",
          null,
          request,
          Constant.logstate.success,
          logid,
          null
        );
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while saving image in AWS S3",
          null,
          request,
          Constant.logstate.failure,
          logid,
          error
        );
        return Promise.reject(new Error("Error while saving image in AWS S3"));
      }
    } else {
      try {
        const base64 = inputData.image;
        const key = `${inputData.sortKey}`;
        // saving image in aws s3 bucket
        image = await s3Helper.saveToS3(key, base64);
        inputData.image = image.Location;
        await util.writeToCloudWatch(
          "Saving base64 string to S3 bucket",
          null,
          request,
          Constant.logstate.success,
          logid,
          null
        );
      } catch (error) {
        await util.writeToCloudWatch(
          "Error while saving image in AWS S3",
          null,
          request,
          Constant.logstate.failure,
          logid,
          error
        );
        return Promise.reject(new Error("Error while saving image in AWS S3"));
      }
    }

    /**
     * Saving base64 string to dynamoDB
     * Description: The below line is able to perform the saving base64 string to dynamoDB
     * If we don't want to save image to S3 bucket then we have to comment the above else
     * block which is able to save image to S3 bucket and uncomment the below line.
     */
    // newMenuItem.image = inputData.image;
  }

  // calculating price
  inputData.price =
    inputData.actualPrice - (inputData.actualPrice * inputData.discount) / 100;
  try {
    updatedMenuItem = await dynamobdHelper.updateMenuItem(
      inputData,
      "fd_table_restaurant"
    );
    await util.writeToCloudWatch(
      "Updating menu item",
      updatedMenuItem,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    updatedMenuItem.Attributes.restaurantId = updatedMenuItem.Attributes.id;
    updatedMenuItem.Attributes.menuItemId = updatedMenuItem.Attributes.sortKey;
    delete updatedMenuItem.Attributes.id;
    delete updatedMenuItem.Attributes.sortKey;
    return Promise.resolve(updatedMenuItem.Attributes);
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while updating menu item",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
}

async function filterQuerry(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "filterQuerry",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  const menuItemList = [];
  let Filter;
  try {
    Filter = await dynamobdHelper.filterQuerry(inputData, true);
    await util.writeToCloudWatch(
      "Filter query",
      Filter,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!Filter.Items.length) {
      return Promise.reject(new Error("Invalid Filter"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error in filter query",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  Filter.Items.forEach((element) => {
    let menuItem = {};
    if (element.sortKey) {
      menuItem = element;
      menuItem.id = element.id;
      menuItem.sortKey = element.sortKey;
      menuItem.menuItemName = element.menuItemName;
      menuItem.actualPrice = element.actualPrice;
      menuItem.price = element.price;
      menuItem.description = element.description;
      menuItem.discount = element.discount;

      menuItemList.push(menuItem);
    }
  });

  return Promise.resolve(menuItemList);
}

async function createMenuItemByExcelFile(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "createMenuItemByExcelFile",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let createMenu;
  let data = [];
  const menuItemList = [];
  const returnMenuItemlist = [];
  let buffer;
  try {
    const restaurantList = await dynamobdHelper.getRestaurantDetails(
      inputData.restaurantId,
      true
    );
    await util.writeToCloudWatch(
      "Fetching restaurant details",
      inputData,
      request,
      Constant.logstate.initial,
      logid,
      null
    );
    if (!restaurantList.Items.length) {
      return Promise.reject(new Error("Invalid restaurantId"));
    }
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
  try {
    const { restaurantId } = inputData;
    const base64String = inputData.excelbase64;
    data = await layerUtil.base64ToJson(base64String, restaurantId);
    await util.writeToCloudWatch(
      "caliing base64ToJSON",
      data,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!data) {
      return Promise.reject(new Error("Invalid excelToJson data"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while calling base64ToJSON",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  try {
    data.forEach((element) => {
      const menuItemId = `#MENUITEM#${uuid()}`;
      const menuItem = { ...element };
      const returnMenuItem = { ...element };
      returnMenuItem.menuItemId = menuItemId;
      returnMenuItem.restaurantId = inputData.restaurantId;
      menuItem.sortKey = menuItemId;
      menuItem.id = inputData.restaurantId;
      menuItem.price =
        element.actualPrice - (element.actualPrice * element.discount) / 100;
      returnMenuItem.price =
        element.actualPrice - (element.actualPrice * element.discount) / 100;
      menuItemList.push(menuItem);
      returnMenuItemlist.push(returnMenuItem);
    });
  } catch (e) {
    return Promise.reject(e);
  }
  try {
    createMenu = await dynamobdHelper.createMenuItemByExcelFile(menuItemList);
    await util.writeToCloudWatch(
      "Saving menu items using excel file",
      createMenu,
      request,
      Constant.logstate.success,
      logid,
      null
    );
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while saving menu items using excel file",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
  return Promise.resolve(returnMenuItemlist);
}

async function filterQuerry(inputData, request) {
  const menuItemList = [];

  let Filter;
  try {
    Filter = await dynamobdHelper.filterQuerry(inputData, true);

    if (!Filter.Items.length) {
      return Promise.reject(new Error("Invalid Filter"));
    }
  } catch (e) {
    return Promise.reject(e);
  }

  Filter.Items.forEach((element) => {
    let menuItem = {};

    menuItem = element;
    menuItem.id = element.id;
    menuItem.sortKey = element.sortKey;
    menuItem.menuItemName = element.menuItemName;
    menuItem.actualPrice = element.actualPrice;
    menuItem.price = element.price;
    menuItem.description = element.description;
    menuItem.discount = element.discount;
    // delete menuItem.id;
    // delete menuItem.sortKey;
    menuItemList.push(menuItem);
  });

  return Promise.resolve(menuItemList);
}

module.exports = {
  createMenuItem,
  getMenuItemsByRestaurantId,
  deleteMenuItem,
  updateMenuItem,
  filterQuerry,
  createMenuItemByExcelFile,
};
