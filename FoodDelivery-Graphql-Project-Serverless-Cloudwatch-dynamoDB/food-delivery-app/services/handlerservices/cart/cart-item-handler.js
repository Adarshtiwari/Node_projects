/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unresolved */
const { uuid } = require('uuidv4');
const dynamobdHelper = require('../../../lib/dynamodb-helper');
const util = require('../../../lib/util');
const Constant = require('../../../lib/constants');
// update cartItem
async function updateCartItem(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch('updateCartItem', inputData, request, Constant.logstate.initial, logid, null);
  let cartItem;
  try {
    // fetching cartItem details
    cartItem = await dynamobdHelper.getCartItem(inputData.cartId, inputData.cartItemId);
    await util.writeToCloudWatch('Fetching cart item details', cartItem, request, Constant.logstate.success, logid, null);
    if (!cartItem.Items.length && !cartItem.Count) {
      return Promise.reject(new Error('Invalid cartId or cartItemId'));
    }
  } catch (error) {
    await util.writeToCloudWatch('Error while fetching cart item details', null, request, Constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
  const { price } = cartItem.Items[0].menuItem;

  // creating new cart object
  const newCartItem = {
    id: inputData.cartId,
    sortKey: inputData.cartItemId,
    quantity: inputData.quantity,
    totalPrice: price * inputData.quantity,
  };
  let updatedCartItem;
  try {
    // saving new cartItem details
    updatedCartItem = await dynamobdHelper.updateCartItem(newCartItem);
    await util.writeToCloudWatch('Update cart item details', updatedCartItem, request, Constant.logstate.success, logid, null);
    updatedCartItem.cartId = updatedCartItem.id;
    updatedCartItem.cartItemId = updatedCartItem.sortKey;
    updatedCartItem.menuItemId = updatedCartItem.menuItem.menuItemId;
    delete updatedCartItem.id;
    delete updatedCartItem.sortKey;
    // delete updatedCartItem.menuItem;
    return Promise.resolve(updatedCartItem);
  } catch (error) {
    await util.writeToCloudWatch('Error while updating cart item details', null, request, Constant.logstate.failure, logid, error);
    return Promise.reject(error);
  }
}

module.exports = {
  updateCartItem,
};
