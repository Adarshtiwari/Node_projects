/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-unused-vars */
const { uuid } = require("uuidv4");
const util = require("../../../lib/util");
const dynamobdHelper = require("../../../lib/dynamodb-helper");
const Constant = require("../../../lib/constants");
const layerUtil = require("/opt/custom_modules/util");

/**
 *
 * @param {*} inputData
 * @returns  delivery object
 *  @author Nikita Jaiswal
 */
function updateDeliveryDetailsMapping(inputData) {
  const deliveryData = {
    id: inputData.orderId,
    sortKey: inputData.deliveryId,
    deliveryStatus: inputData.deliveryStatus,
  };
  return deliveryData;
}

/**
 *
 * @param {inputdata} inputData
 * @returns Delivery object
 * @author Nikita Jaiswal
 */
async function updateDeliveryDetails(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "updateDeliveryDetails",
    inputData,
    request,
    Constant.logstate.initial,
    logid,
    null
  );
  let delivery;
  let user;
  let isOrder;
  let orderItem = [];
  try {
    // validating orderId
    delivery = await dynamobdHelper.getDeliveryByOrderId(inputData.orderId);
    await util.writeToCloudWatch(
      "Fetching delivery details by order id",
      delivery,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!delivery.Items.length && !delivery.Count) {
      return Promise.reject(new Error("Invalid orderId"));
    }
    delivery = delivery.Items[0];
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching delivery details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  if (delivery.deliveryStatus === inputData.deliveryStatus) {
    return Promise.reject(new Error("Already upto date"));
  }

  try {
    user = await dynamobdHelper.getUserByUserId(delivery.deliveryBoyId);
    if (!user.Count) {
      return Promise.reject(new Error("Invalid userId"));
    }
    user = user.Items[0];
  } catch (error) {
    return Promise.reject(error);
  }
  try {
    isOrder = await dynamobdHelper.getOrderById(inputData.orderId);
    if (!isOrder.Items.length && !isOrder.Count) {
      return Promise.reject(new Error("Invalid orderId"));
    }
    isOrder = isOrder.Items.reduce((acc, curr) => {
      const orderId = `#${curr.id}`;
      if (orderId === curr.sortKey) {
        acc = curr;
      } else {
        const order = curr;
        order.orderId = curr.id;
        order.orderItemId = curr.sortKey;
        order.menuItem = curr.menuItem;
        orderItem.push(order);
      }
      return acc;
    }, {});
  } catch (error) {
    return Promise.reject(error);
  }
  if (inputData.deliveryStatus === Constant.deliveryStatus.Delivered) {
    isOrder.orderStatus = Constant.orderStatus.Delivered;
    isOrder.isPaid = true;
    user.deliveryBoyStatus = Constant.deliveryBoyStatus.Available;
    delivery.deliveryStatus = inputData.deliveryStatus;
    const transactItems = util.deliveredTransaction(isOrder, user);
    try {
      const result = await dynamobdHelper.updateOrderStatusByTransactions(
        transactItems
      );
      if (!result) {
        return Promise.reject(new Error("Error while delivery status"));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }
  if (inputData.deliveryStatus === Constant.deliveryStatus.Failed) {
    isOrder.orderStatus = Constant.orderStatus.Failed;
    user.deliveryBoyStatus = Constant.deliveryBoyStatus.Available;
    delivery.deliveryStatus = Constant.deliveryStatus.Failed;
    const transactItems = util.failedDeliveryTransaction(
      isOrder,
      delivery,
      user
    );
    try {
      const result = await dynamobdHelper.updateOrderStatusByTransactions(
        transactItems
      );
      if (!result) {
        return Promise.reject(new Error("Error while updating order status"));
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  isOrder.orderId = isOrder.id;
  isOrder.orderItem = orderItem;
  const channelName = isOrder.orderId.replace("#", "-");
  await layerUtil.pushNotification(channelName, "orderIsUpdated", isOrder);
  delivery.orderId = inputData.orderId;
  return Promise.resolve(delivery);
}

async function getDeliveryDetailsByUserId(input, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getDeliveryDetailsByUserId",
    input,
    request,
    Constant.logstate.initial,
    logid,
    null
  );

  let delivery;
  const output = [];
  try {
    delivery = await dynamobdHelper.getDeliveryDetailsByUserId(input);
    await util.writeToCloudWatch(
      "Fetching delivery details by user id",
      delivery,
      request,
      Constant.logstate.success,
      logid,
      null
    );
    if (!delivery.length && !delivery.Count) {
      return Promise.reject(new Error("in valid id"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching delivery details",
      null,
      request,
      Constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  delivery.forEach((element) => {
    const deliveryobj = element;
    deliveryobj.orderId = element.id;
    deliveryobj.deliveryId = element.sortKey;
    deliveryobj.userId = element.userid;
    delete deliveryobj.id;
    delete deliveryobj.sortKey;
    delete deliveryobj.userid;
    output.push(deliveryobj);
  });
  return output;
}

module.exports = {
  updateDeliveryDetails,
  getDeliveryDetailsByUserId,
};
