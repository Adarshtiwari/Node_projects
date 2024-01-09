/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
const { uuid } = require("uuidv4");
const util = require("../../../lib/util");
const dynamobdHelper = require("../../../lib/dynamodb-helper");
const Constant = require("../../../lib/constants");
const logger = require("../../../lib/logger");
const userHandelr = require("../user/user-handler");

// delete cart-item from cart
async function deleteCartItem(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "deleteCartItem",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );
  let item = {};
  try {
    // get item by cartId and menuItemId
    item = await dynamobdHelper.getCartItem(
      inputData.cartId,
      inputData.cartItemId
    );

    await util.writeToCloudWatch(
      "Fetching cart item",
      item,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!item.Items.length && !item.Count) {
      return Promise.reject(new Error("Invalid cartId or cartItemId"));
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching cart item",
      null,
      request,
      Constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }
  try {
    await dynamobdHelper.deleteCartItem(inputData);
    await util.writeToCloudWatch(
      "deleting cart item",
      inputData,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    item.Items[0].cartId = item.Items[0].id;
    item.Items[0].cartItemId = item.Items[0].sortKey;
    const menuItemObj = item.Items[0].menuItem;
    menuItemObj.restaurantId = menuItemObj.menuItemId;
    menuItemObj.menuItemId = item.Items[0].menuItemId;
    item.Items[0].menuItem = menuItemObj;
    delete item.Items[0].id;
    delete item.Items[0].sortKey;
    return Promise.resolve(item.Items[0]);
  } catch (e) {
    await util.writeToCloudWatch(
      "Erroe while deleting cart item",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
}
// get cart item list
async function getCartlist(inputData, request) {
  const logid = uuid();

  // App logs
  await util.writeToCloudWatch(
    "getCartlist",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  const user = await userHandelr.getUser(inputData);

  if (!user || user.userType !== Constant.userType.User) {
    return Promise.reject(new Error("Invalid user id"));
  }

  const result = {};
  const resultdata = {
    cartId: "",
    cartItems: [],
  };
  const cartItemList = [];
  let cartid;

  try {
    const cartList = await dynamobdHelper.getCartlist(inputData.userId);
    await util.writeToCloudWatch(
      "Fetching cart list",
      result,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    cartList.Items.forEach((element) => {
      let cartItem = {};
      let menuItemObj = {};
      cartid = element.id;

      if (element.sortKey !== `#${element.id}`) {
        cartItem = element;
        cartItem.cartId = element.id;
        cartItem.cartItemId = element.sortKey;
        menuItemObj = cartItem.menuItem;
        menuItemObj.restaurantId = menuItemObj.menuItemId;
        menuItemObj.menuItemId = cartItem.menuItemId;
        cartItem.menuItem = menuItemObj;
        delete cartItem.id;
        delete cartItem.sortKey;
        cartItemList.push(cartItem);
        resultdata.cartItems = cartItemList;
      }
    });
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching cart list",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  resultdata.cartId = cartid;
  console.log();
  return Promise.resolve(resultdata);
}

async function createCartItem(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "createCartItem",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let cartItemInput;
  let cartDetails;
  let cartItemCreated;
  let tempResult = {};
  try {
    cartItemInput = newCartItemMapping(inputData);
    const result = await dynamobdHelper.getMenuItemDetails(cartItemInput);

    await util.writeToCloudWatch(
      "Fetching menu item details",
      result,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    result.Items[0].menuItemId = result.Items[0].sortKey;
    delete result.Items[0].sortKey;
    delete result.Items[0].id;
    const menuItemDetails = result.Items[0];
    // seting total price to cart item
    cartItemInput.totalPrice = cartItemInput.quantity * menuItemDetails.price;
    // adding menuItem details in cartItem object
    cartItemInput.menuItem = menuItemDetails;
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching menu items details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }
  try {
    // fetching cart details by cart id
    cartDetails = await dynamobdHelper.getCart(inputData.cartId);
    await util.writeToCloudWatch(
      "Fetching cart details",
      cartDetails,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!cartDetails.Items.length && !cartDetails.Count) {
      return Promise.reject(new Error("Invalid cart id"));
    }
    if (cartDetails.Count === 1) {
      cartDetails.Items[0].restaurantId = inputData.restaurantId;
      await dynamobdHelper.updateCartItem(cartDetails.Items[0]);
      await util.writeToCloudWatch(
        "Updating cart item",
        null,
        request,
        Constant.logstate.success,
        logid,
        null
      );
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching or updating cart details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error.errorMessage);
  }
  tempResult = cartDetails.Items.forEach((element) => {
    if (element.menuItemId === inputData.menuItemId) {
      return Promise.reject(new Error("Cart item already exists"));
    }
    return null;
  });
  if (tempResult) {
    return tempResult;
  }
  try {
    delete cartItemInput.restaurantId;
    cartItemCreated = await dynamobdHelper.addItemsToCart(cartItemInput);
    await util.writeToCloudWatch(
      "Saving cart item",
      cartItemCreated,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    cartItemInput.cartId = cartItemInput.id;
    cartItemInput.cartItemId = cartItemInput.sortKey;
    delete cartItemInput.id;
    delete cartItemInput.sortKey;
    return Promise.resolve(cartItemInput);
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while saving cart item",
      null,
      request,
      Constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }
}
function newCartItemMapping(inputData) {
  const cartItemId = `#CARTITEM#${uuid()}`;
  const cartObj = {
    id: inputData.cartId,
    sortKey: cartItemId,
    menuItemId: inputData.menuItemId,
    quantity: inputData.quantity,
    restaurantId: inputData.restaurantId,
  };
  return cartObj;
}

module.exports = {
  createCartItem,
  getCartlist,
  deleteCartItem,
};
