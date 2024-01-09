/* eslint-disable import/no-absolute-path */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */
// eslint-disable-next-line import/no-unresolved
const { uuid } = require("uuidv4");
const constant = require("../../../lib/constants");
const dynamobdHelper = require("../../../lib/dynamodb-helper");
const util = require("../../../lib/util");
const restaurant = require("../restaurant/restaurant-handler");
const layerUtil = require("/opt/custom_modules/util");

// menuItem response mapping
function menuItemResponseMapping(orderItem) {
  const menuItem = {
    orderId: orderItem.id,
    orderItemId: orderItem.sortKey,
    menuItem: orderItem.menuItem,
    quantity: orderItem.quantity,
    totalPrice: orderItem.totalPrice,
  };
  return menuItem;
}

// order item mapping
function ordeItemMapping(element, orderId) {
  const orderObj = {
    id: orderId,
    sortKey: `#ORDERITEM#${uuid()}`,
    menuItem: element.menuItem,
    quantity: element.quantity,
    totalPrice: element.totalPrice,
    tableName: constant.DDBTables.order,
  };
  return orderObj;
}

// order mapping
function orderMapping(element, orderId, inputData) {
  const orderObj = {
    id: orderId,
    sortKey: `#${orderId}`,
    userId: inputData.userId,
    restaurantId: element.restaurantId,
    orderDate: new Date().toISOString(),
    orderStatus: constant.orderStatus.InProgress,
    paymentMode: inputData.paymentMode,
    isPaid: false,
    tableName: constant.DDBTables.order,
  };
  return orderObj;
}

// update order mapping
function updateOrderMapping(inputData) {
  const sKey = `#${inputData.orderId}`;
  const orderData = {
    id: inputData.orderId,
    sortKey: sKey,
    orderStatus: inputData.orderStatus,
    isPaid: "true",
  };
  return orderData;
}

// update delivery mapping
function deliveryStatusMapping(inputData, status) {
  const sKey = `#${inputData.orderId}`;
  const deliveryData = {
    id: inputData.orderId,
    sortKey: sKey,
    deliveryStatus: status,
  };
  return deliveryData;
}

function deliveryMapping(order, deliveryBoyId) {
  const delivery = {
    id: order.id,
    deliveryBoyId,
    userId: order.userId,
    deliveryStatus: constant.deliveryStatus.Processing,
    pickUpTime: null,
    deliveredTime: null,
  };
  return delivery;
}

// billing mapping
function billingMapping(order) {
  const billing = {
    id: order.id,
    userId: order.userId,
    paymentMode: order.paymentMode,
    billingDate: new Date().toISOString(),
  };
  return billing;
}

// response object mapping
function responseObjMapping(orderParam, menuItemResp) {
  const order = orderParam;
  const orderItem = menuItemResp;
  // const delivery = deliveryParam;
  // const billing = billingParam;
  order.orderId = order.id;
  order.orderItem = orderItem;
  // delivery.orderId = delivery.id;
  // delivery.deliveryId = delivery.sortKey;
  // billing.orderId = billing.id;
  // delete delivery.id;
  // delete delivery.sortKey;
  delete order.id;
  delete order.sortKey;
  delete order.tableName;
  // delete delivery.tableName;
  // delete billing.tableName;
  // delete billing.id;
  // order.delivery = delivery;
  // order.billing = billing;
  return order;
}

async function listOrderById(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "listOrderById",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  const orderId = inputData.orderId;
  let order;
  let result;
  const orderItem = [];

  try {
    // if(orderId) {

    result = await dynamobdHelper.getOrderById(orderId);
    await util.writeToCloudWatch(
      "Fetching order details by id",
      result,
      request,
      constant.logstate.success,
      logid,
      null
    );
    if (!result.Items.length && !result.Count) {
      return Promise.resolve("Invalid order id");
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching order details",
      inputData,
      request,
      constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }

  result.Items.forEach((item) => {
    const tempKey = item.id;
    const sKey = `#${tempKey}`;

    if (sKey === item.sortKey) {
      order = item;
      order.orderId = order.id;
      delete order.id;
      delete order.sortKey;
    } else {
      const orderItemObj = item;
      orderItemObj.orderId = orderItemObj.id;
      orderItemObj.orderItemId = orderItemObj.sortKey;
      delete orderItemObj.id;
      delete orderItemObj.sortKey;

      orderItem.push(orderItemObj);
    }
  });

  order.orderItem = orderItem;
  return Promise.resolve(order);
}

// update order
async function updateOrder(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "updateOrder",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  let isOrder;
  let deliveryBoys;
  let deliveryBoy;
  const orderItem = [];
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

  if (isOrder.orderStatus === inputData.orderStatus) {
    return Promise.reject(new Error("Already upto date"));
  }

  if (inputData.orderStatus === constant.orderStatus.Accept) {
    if (isOrder.orderStatus !== constant.orderStatus.InProgress) {
      return Promise.reject(new Error("Already Accepted"));
    }
    try {
      deliveryBoys = await dynamobdHelper.getDeliveryBoys();
      if (!deliveryBoys.length) {
        return Promise.reject(new Error("No delivery boy is found"));
      }
    } catch (error) {
      return Promise.reject(error);
    }
    deliveryBoys = deliveryBoys.reduce((acc, curr) => {
      if (curr.deliveryBoyStatus === constant.deliveryBoyStatus.Available) {
        acc.push(curr);
      }
      return acc;
    }, []);
    deliveryBoy = util.getRandomFromArray(deliveryBoys);
    isOrder.orderStatus = inputData.orderStatus;
    deliveryBoy.deliveryBoyStatus = constant.deliveryBoyStatus.Busy;
    const delivery = deliveryMapping(isOrder, deliveryBoy.id);
    const billing = billingMapping(isOrder);
    const transactItems = util.createTransactionParamForUpdateOrderStatus(
      isOrder,
      deliveryBoy,
      delivery,
      billing
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

  if (inputData.orderStatus === constant.orderStatus.OutForDelivery) {
    isOrder.orderStatus = constant.orderStatus.OutForDelivery;
    const transactItems = util.orderOutForDeliveryTransaction(isOrder);
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

  if (inputData.orderStatus === constant.orderStatus.Delivered) {
    let delivery;
    let user;
    try {
      delivery = await dynamobdHelper.getDeliveryByOrderId(inputData.orderId);
      if (!delivery.Count) {
        return Promise.reject(new Error("Invalid orderId"));
      }
    } catch (error) {
      return Promise.reject(error);
    }
    try {
      user = await dynamobdHelper.getUserByUserId(
        delivery.Items[0].deliveryBoyId
      );
      if (!user.Count) {
        return Promise.reject(new Error("Invalid userId"));
      }
      user = user.Items[0];
    } catch (error) {
      return Promise.reject(error);
    }
    user.deliveryBoyStatus = constant.deliveryBoyStatus.Available;
    isOrder.orderStatus = constant.orderStatus.Delivered;
    isOrder.isPaid = true;
    const transactItems = util.deliveredTransaction(isOrder, user);
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

  if (
    inputData.orderStatus === constant.orderStatus.Reject ||
    inputData.orderStatus === constant.orderStatus.Preparing
  ) {
    isOrder.orderStatus = inputData.orderStatus;
    // const transactItems = util.deliveredTransaction(isOrder);
    try {
      const result = await dynamobdHelper.updateOrder(isOrder);
      if (!result.Attributes) {
        return Promise.reject(new Error("Error while updating order status"));
      }
      isOrder.id = result.Attributes.id;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  isOrder.orderId = isOrder.id;
  isOrder.orderItem = orderItem;
  const channelName = isOrder.orderId.replace("#", "-");
  await layerUtil.pushNotification(channelName, "orderIsUpdated", isOrder);
  return Promise.resolve(isOrder);
}

// create order
async function createOrder(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "createOrder",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  let cart;
  const orderArr = [];
  let order;
  let orderItem;
  const menuItemResp = [];
  const deleteCartItems = [];
  let orderCreated;
  let deliveryBoys;
  let delivery;
  let billing;

  try {
    // fetching cart details by cartId
    cart = await dynamobdHelper.getCart(inputData.cartId);
    await util.writeToCloudWatch(
      "Fetching cart details",
      cart,
      request,
      constant.logstate.success,
      logid,
      null
    );
    // validating cartId
    if (!cart.Items.length && !cart.Count) {
      return Promise.reject(new Error("Invalid cartId"));
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while fetching cart details",
      null,
      request,
      constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }

  const orderId = `ORDER#${util.genrateTenDigitRandomeNumber()}`;
  // const userId=inputData.userIdl
  let orderTotal = 0;
  cart.Items.forEach(async (element) => {
    const tempKey = element.id;
    let menuItem;
    const partitionKey = `#${tempKey}`;
    if (partitionKey === element.sortKey) {
      order = orderMapping(element, orderId, inputData);
      orderArr.push(order);
    } else {
      orderItem = ordeItemMapping(element, orderId);
      menuItem = menuItemResponseMapping(orderItem);
      deleteCartItems.push(element);
      orderTotal += orderItem.totalPrice;
      menuItem.quantity = orderItem.quantity;
      orderArr.push(orderItem);
      menuItemResp.push(menuItem);
    }
  });

  // calculating order total price
  orderArr.forEach(async (element) => {
    const tempKey = element.id;
    const partitionKey = `#${tempKey}`;
    if (partitionKey === element.sortKey) {
      element.totalPrice = orderTotal;
    }
  });

  // create delivery object details
  // try {
  //   // fetching delivery boys
  //   deliveryBoys = await dynamobdHelper.getDeliveryBoys();
  //   await util.writeToCloudWatch('Fetching delivery boys', deliveryBoys, request, constant.logstate.success, logid, null);
  //   const deliveryId = `#DELIVERY${uuid()}`;
  //   delivery = {
  //     id: orderId,
  //     sortKey: deliveryId,
  //     deliveryBoyId: deliveryBoys[0].id,
  //     userId: inputData.userId,
  //     deliveryStatus: constant.deliveryStatus.Processing,
  //     tableName: constant.DDBTables.order,
  //   };

  //   // pushing delivery object details in array
  //   orderArr.push(delivery);

  //   // create billing object details
  //   billing = billingMapping(orderId, inputData);

  //   // pushing billing object details in array
  //   orderArr.push(billing);
  // } catch (error) {
  //   await util.writeToCloudWatch('Error while fetching delivery boys', null, request, constant.logstate.initial, logid, error);
  //   return Promise.reject(error);
  // }
  try {
    // saving order and order item object
    await dynamobdHelper.createOrder(orderArr, deleteCartItems);
    await util.writeToCloudWatch(
      "Saving order details",
      null,
      request,
      constant.logstate.success,
      logid,
      null
    );
    // mapping response object
    const responseObj = responseObjMapping(order, menuItemResp);
    const channelName = responseObj.restaurantId.replace("#", "-");
    const t = await layerUtil.pushNotification(
      channelName,
      "newOrderIsCreated",
      responseObj
    );
    return Promise.resolve(responseObj);
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while saving order detials",
      null,
      request,
      constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }
}

async function getDeliveryDetailsByDeliveryBoyId(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "getDeliveryDetailsByDeliveryBoyId",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  let result;
  let delivery;
  const deliveryDetails = [];

  const { deliveryBoyId } = inputData;
  try {
    result = await dynamobdHelper.getDeliveryList(deliveryBoyId);
    await util.writeToCloudWatch(
      "Fetching delivery list",
      result,
      request,
      constant.logstate.success,
      logid,
      null
    );
    for (let i = 0; i < result.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop

      const user = await dynamobdHelper.getUserByUserId(result[i].userId);
      let orderIdObj = {
        orderId: result[i].id,
      };
      const orderByOrderId = await listOrderById(orderIdObj);

      const res = {};
      res.id = orderByOrderId.restaurantId;

      const restaurantDetails = await restaurant.getRestaurantById(res);

      user.Items[0].userId = user.Items[0].id;
      // orderByOrderId.Items[0].orderId = orderByOrderId.Items[0].id;

      delete user.Items[0].id;
      // delete orderByOrderId.Items[0].id;

      delivery = result[i];
      delivery.orderId = delivery.id;
      delivery.deliveryId = delivery.sortKey;
      delivery.user = user.Items[0];

      delivery.order = orderByOrderId;

      delete restaurantDetails.sortKeysArr;

      delivery.restaurant = restaurantDetails;

      delete delivery.sortKey;
      delete delivery.id;
      delete delivery.userId;

      deliveryDetails.push(delivery);
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching delivery list",
      null,
      request,
      constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }

  return Promise.resolve(deliveryDetails);
}

async function getOrderListUserId(inputData, request) {
  let result = {};

  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "listOrderByuserId",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  try {
    // if(orderId) {
    result = await dynamobdHelper.getOrderListUserId(inputData.userId);

    await util.writeToCloudWatch(
      "Fetching user details by id",
      result,
      request,
      constant.logstate.success,
      logid,
      null
    );
    if (!result) {
      return Promise.resolve("Invalid user id");
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching order details",
      inputData,
      request,
      constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }

  return Promise.resolve(result);
}

async function getOrderListByRestaurantId(inputData, request) {
  let result = {};

  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "listOrderByrestaurantId",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  try {
    // if(orderId) {
    result = await dynamobdHelper.getOrderListByRestaurantId(
      inputData.restaurantID
    );

    const i = 0;

    await util.writeToCloudWatch(
      "Fetching user details by id",
      result,
      request,
      constant.logstate.success,
      logid,
      null
    );
    if (!result) {
      return Promise.resolve("Invalid user id");
    }
  } catch (error) {
    await util.writeToCloudWatch(
      "Error while fetching order details",
      inputData,
      request,
      constant.logstate.failure,
      logid,
      error
    );
    return Promise.reject(error);
  }

  return Promise.resolve(result);
}

async function updateOrderStatus(inputData, request) {
  const logid = uuid();
  // App logs
  await util.writeToCloudWatch(
    "updateOrder",
    inputData,
    request,
    constant.logstate.initial,
    logid,
    null
  );

  try {
    const order = await updateOrderMapping(inputData);

    if (order.orderStatus.match("preparing")) {
      delete order.isPaid;

      const updatedOrder = await dynamobdHelper.updateOrder(order);
      await util.writeToCloudWatch(
        "Updating order details",
        updatedOrder,
        request,
        constant.logstate.success,
        logid,
        null
      );
      if (!updatedOrder.Attributes) {
        return Promise.reject(new Error("Invalid orderId"));
      }
      const orderObj = updatedOrder.Attributes;
      orderObj.orderId = updatedOrder.Attributes.id;
      delete orderObj.id;
      delete orderObj.sortKey;
      return Promise.resolve(orderObj);
    }

    if (order.orderStatus.match("checkout for delivery")) {
      delete order.isPaid;

      const updatedOrder = await dynamobdHelper.updateOrder(order);

      await util.writeToCloudWatch(
        "Updating order details",
        updatedOrder,
        request,
        constant.logstate.success,
        logid,
        null
      );

      if (!updatedOrder.Attributes) {
        return Promise.reject(new Error("Invalid orderId"));
      }
      const orderObj = updatedOrder.Attributes;
      orderObj.orderId = updatedOrder.Attributes.id;
      delete orderObj.id;
      delete orderObj.sortKey;

      const delivery = await deliveryStatusMapping(inputData, "on the way");
      const deliveryupdatedOrder = await dynamobdHelper.deliveryupdatedOrder(
        delivery
      );

      return Promise.resolve(orderObj);
    }

    if (inputData.deliveryStatus.match("deliverd")) {
      const updatedOrder = await dynamobdHelper.updateOrder(order);

      await util.writeToCloudWatch(
        "Updating order details",
        updatedOrder,
        request,
        constant.logstate.success,
        logid,
        null
      );

      if (!updatedOrder.Attributes) {
        return Promise.reject(new Error("Invalid orderId"));
      }
      const orderObj = updatedOrder.Attributes;
      orderObj.orderId = updatedOrder.Attributes.id;
      delete orderObj.id;
      delete orderObj.sortKey;

      const delivery = await deliveryStatusMapping(inputData, "deliverd");
      const deliveryupdatedOrder = await dynamobdHelper.deliveryupdatedOrder(
        delivery
      );
      return Promise.resolve(orderObj);
    }
  } catch (e) {
    await util.writeToCloudWatch(
      "Error while updating order details",
      null,
      request,
      constant.logstate.failure,
      logid,
      e
    );
    return Promise.reject(e);
  }
}

module.exports = {
  updateOrder,
  createOrder,
  listOrderById,
  getDeliveryDetailsByDeliveryBoyId,
  getOrderListUserId,
  getOrderListByRestaurantId,
  updateOrderStatus,
};
