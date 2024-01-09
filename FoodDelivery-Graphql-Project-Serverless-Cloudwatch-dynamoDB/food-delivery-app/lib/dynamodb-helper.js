/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
// eslint-disable-next-line import/no-absolute-path
const dynamobdHandler = require("/opt/custom_modules/dynamodb-handler");
const Constant = require("./constants");
const logger = require("./logger");

const DDBTables = {
  restauranttable: Constant.DDBTables.restaurant,
  userTable: Constant.DDBTables.user,
  cartTable: Constant.DDBTables.cart,
  orderTable: Constant.DDBTables.order,
  billing: Constant.DDBTables.billing,
  billingTable: Constant.DDBTables.billing,
  delivery: Constant.DDBTables.delivery,
};

// create restaurant
async function writeRestaurant(newRestaurant) {
  const resTable = DDBTables.restauranttable;

  try {
    await dynamobdHandler.putInTable(newRestaurant, resTable);

    return Promise.resolve("Table created successfully");
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * This method is responsible for creating new menuItem inside restaurant table
 * @param {Object} newMenuItem This object contain menuItem details
 */
async function writeMenuItem(newMenuItem) {
  const resTable = DDBTables.restauranttable;

  try {
    await dynamobdHandler.putInTable(newMenuItem, resTable);

    return Promise.resolve("Table created successfully");
  } catch (e) {
    return Promise.reject(e);
  }
}
// get restaurant details
async function getRestaurantDetails(id, isGetDetails) {
  let params;

  if (isGetDetails) {
    params = {
      TableName: DDBTables.restauranttable,
      KeyConditionExpression: "#Id = :ID_val",
      ExpressionAttributeNames: {
        "#Id": "id",
      },
      ExpressionAttributeValues: {
        ":ID_val": id,
      },
    };
  }
  return dynamobdHandler.getTableItems(params);
}

// get restaurant details
async function getCartItemsDetails(id, isGetDetails) {
  let params;

  if (isGetDetails) {
    params = {
      TableName: DDBTables.cartTable,
      KeyConditionExpression: "#Id = :ID_val",
      ExpressionAttributeNames: {
        "#Id": "id",
      },
      ExpressionAttributeValues: {
        ":ID_val": id,
      },
    };
  }
  return dynamobdHandler.getTableItems(params);
}

/**
 * This method is responsible for deleting user by userId
 * @param {String} userId This string contains userId
 */
async function deleteUser(userId) {
  const { userTable } = DDBTables;
  const params = {
    Key: {
      id: userId,
    },
    TableName: userTable,
  };
  try {
    const isDeleted = await dynamobdHandler.deleteItem(params);

    return Promise.resolve(isDeleted);
  } catch (e) {
    return Promise.reject(e);
  }
}
/**
 * This method is responsible for fetching user object by userId from the db
 * @param {String} id This String contains userId of a particular user
 * @returns It will return the user object if successfully found, otherwise return error
 */
async function getUserByUserId(id) {
  const params = {
    TableName: DDBTables.userTable,
    KeyConditionExpression: "#Id = :ID_val",
    ExpressionAttributeNames: {
      "#Id": "id",
    },
    ExpressionAttributeValues: {
      ":ID_val": id,
    },
  };
  return dynamobdHandler.getTableItems(params);
}

// create user
async function writeUser(newUser) {
  const { userTable } = DDBTables;
  try {
    await dynamobdHandler.putInTable(newUser, userTable);

    return Promise.resolve("Table created successfully");
  } catch (e) {
    return Promise.reject(e);
  }
}

// update user
async function updateUser(updatedInput) {
  const { userTable } = DDBTables;
  try {
    const dbResult = await dynamobdHandler.updateItemsQuerybyPK(
      updatedInput,
      userTable
    );

    return Promise.resolve(dbResult);
  } catch (e) {
    return Promise.reject(e);
  }
}

// get user list
async function getUserList(isGetDetails) {
  let params;
  if (isGetDetails) {
    params = {
      TableName: DDBTables.usertable,
    };
  }

  return dynamobdHandler.getList(params);
}

// get cart list
async function getCartlist(userId) {
  let params = {};
  let queryParams = {};
  let cartId;
  params = {
    TableName: DDBTables.cartTable,
  };
  const retrievedList = await dynamobdHandler.getItem(params);
  // filtering items for given user id
  const list = retrievedList.Items;
  list.filter((item) => {
    if (item.userId === userId) {
      cartId = item.id;
    }
  });
  // params for cart items
  queryParams = {
    TableName: DDBTables.cartTable,
    KeyConditionExpression: "#Id = :ID_val",
    ExpressionAttributeNames: {
      "#Id": "id",
    },
    ExpressionAttributeValues: {
      ":ID_val": cartId,
    },
  };
  const cartItems = await dynamobdHandler.getTableItems(queryParams);
  return cartItems;
}

//getdeliverydetailbyorderidanddeliveryboyidbyindex
// async function getDeliveryDetailByOrderIdAndDeliveryBoyIdByIndex(input) {
//   let delivery = [];
//   let table = DDBTables.delivery

//   let params = {
//     TableName: table,
//     IndexName: "id-deliveryBoyId-index",
//     KeyConditionExpression:
//       "#id = :id_val  and #deliveryBoyId = :deliveryBoyId_val",
//     ExpressionAttributeNames: {
//       "#deliveryBoyId": "deliveryBoyId",
//       "#id": "id",
//     },
//     ExpressionAttributeValues: {
//       ":id_val": input.orderId,
//       ":deliveryBoyId_val": input.deliveryBoyId,
//     },
//   };

//   try {
//     delivery = await dynamobdHandler.getTableItems(params);

//     return delivery;
//   } catch (error) {
//     return Promise.reject(error);
//   }
// }

// orderitemList
async function getOrderListUserId(input) {
  const final = [];

  let orders;
  const params = {
    TableName: DDBTables.orderTable,
    FilterExpression: "userId= :userid",
    ExpressionAttributeValues: { ":userid": input },
  };

  try {
    orders = await dynamobdHandler.getItem(params);
    await Promise.all(
      orders.Items.map(async (element) => {
        const { id } = element;
        delete element.id;

        const submitResult = element;
        submitResult.orderId = id;

        submitResult.restaurant = await getRestaurantById(element.restaurantId);
        const delivery = await getDeliveryListbyorderid(id);

        submitResult.delivery = delivery.map((element) => {
          element.orderId = element.id;
          delete element.id;
          return element;
        });

        submitResult.delivery = submitResult.delivery[0];
        submitResult.restaurant.sortKey = "";
        delete submitResult.restaurant.sortKeysArr;
        delete submitResult.id;
        const orderByOrderId = await getOrderById(id);
        submitResult.orderItem = orderByOrderId.Items.filter((item) =>
          item.sortKey.startsWith("#ORDERITEM#")
        );
        submitResult.orderItem.forEach((element) => {
          element.menuItem.restaurantId = element.menuItem.menuItemId;

          element.orderId = element.id;
          element.orderItemId = element.sortKey;
          delete element.id;
          delete element.sortKey;
        });
        final.push(submitResult);
      })
    );
  } catch (e) {
    logger.info(`error in lib ${e}`);
  }
  return final;
}

async function getOrderListByRestaurantId(input) {
  const final = [];
  const i = 0;
  let filteredList;
  let orders;
  const params = {
    TableName: DDBTables.orderTable,
    FilterExpression: "restaurantId= :restaurantId",
    ExpressionAttributeValues: { ":restaurantId": input },
  };

  let orderByOrderId;
  try {
    orders = await dynamobdHandler.getItem(params);

    await Promise.all(
      orders.Items.map(async (element) => {
        const { id } = element;
        delete element.id;

        const submitResult = element;

        submitResult.orderId = id;

        delete submitResult.id;
        delete submitResult.sortKey;

        orderByOrderId = await getOrderById(id);

        submitResult.orderItem = orderByOrderId.Items.filter((item) =>
          item.sortKey.startsWith("#ORDERITEM#")
        );

        submitResult.orderItem.forEach((element) => {
          element.menuItem.restaurantId = element.menuItem.menuItemId;
          element.orderId = element.id;
          element.orderItemId = element.sortKey;
          delete element.id;
          delete element.sortKey;
        });

        let result=await getUserByUserId(element.userId);
        let userGet = result.Items[0];
        submitResult.user=userGet;
        submitResult.user.userId=  submitResult.user.id;
        delete  submitResult.user.id;
       
      
        final.push(submitResult);
      })
    );
  } catch (e) {
    logger.info(`error in lib ${e}`);
  }
  return final;
}

// deleteMenuItem
async function deleteMenuItem(input, isGetDetails) {
  let params;
  const resTable = DDBTables.restauranttable;

  if (isGetDetails) {
    params = {
      TableName: resTable,

      Key: {
        id: input.id,
        sortKey: input.menuItemId,
      },

      ConditionExpression: "sortKey= :val",

      ExpressionAttributeValues: {
        ":val": input.menuItemId,
      },
    };
  }

  return dynamobdHandler.deleteItem(params);
}

// listrestaurants
async function getRestaurantList(isGetDetails) {
  let params;

  if (isGetDetails) {
    params = {
      TableName: DDBTables.restauranttable,
    };
  }

  return dynamobdHandler.getList(params);
}

// get retaurant by id
async function getRestaurantById(id) {
  const sortKeysArr = [];

  const params = {
    TableName: DDBTables.restauranttable,
    KeyConditionExpression: "#Id = :ID_val",
    ExpressionAttributeNames: {
      "#Id": "id",
    },
    ExpressionAttributeValues: {
      ":ID_val": id,
    },
  };
  const retrievedList = await dynamobdHandler.getTableItems(params);
  const filteredList = retrievedList.Items.filter((item) =>
    item.sortKey.startsWith("#REST#")
  );
  // for (let i = 0; i < filteredList.length; i++) {
  //   sortKeysArr.push(filteredList[i].sortKey);
  // }
  retrievedList.Items.forEach((element) => {
    sortKeysArr.push(element.sortKey);
  });

  const restaurantObj = {
    address: filteredList[0].address,
    restaurantName: filteredList[0].restaurantName,
    sortKeysArr,
    category: filteredList[0].category,
    id: filteredList[0].id,
    image: filteredList[0].image,
    userId: filteredList[0].userId,
    rating: filteredList[0].rating,
  };

  return restaurantObj;
}

// update menu item
async function updateMenuItem(updatedInput, tableName) {
  try {
    //  let response = await dynamobdHandler.putInTable(newConceptItem, Constant.DDBTables.concept);
    const dbResult = await dynamobdHandler.updateItemsQuery(
      updatedInput,
      tableName
    );

    return Promise.resolve(dbResult);
  } catch (e) {
    return Promise.reject(e);
  }
}

// update restaurant
async function updateRestaurant(newRestaurant) {
  const resTable = DDBTables.restauranttable;

  try {
    const dbResult = await dynamobdHandler.updateItemsQuery(
      newRestaurant,
      resTable
    );

    return Promise.resolve(dbResult);
  } catch (e) {
    return Promise.reject(e);
  }
}

// delete restaurant
async function deleteRestaurant(id) {
  const resTable = DDBTables.restauranttable;
  try {
    const dbResult = await dynamobdHandler.deleteAllItemsByPartitionKey(
      resTable,
      id
    );

    return Promise.resolve(dbResult);
  } catch (error) {
    return Promise.reject(error);
  }
}
async function addItemsToCart(params) {
  try {
    const dbResult = await dynamobdHandler.putInTable(
      params,
      DDBTables.cartTable
    );

    return Promise.resolve(dbResult);
  } catch (error) {
    return Promise.reject(error);
  }
}
// user login
async function userLogin(inputData) {
  const { userTable } = DDBTables;
  const params = {
    TableName: userTable,
    FilterExpression: "email = :email",
    ExpressionAttributeValues: { ":email": inputData.email },
  };
  try {
    const user = await dynamobdHandler.getItem(params);
    return user;
  } catch (error) {
    return Promise.reject(error);
  }
}

// creat card
async function createCart(newCart) {
  const { cartTable } = DDBTables;
  try {
    await dynamobdHandler.putInTable(newCart, cartTable);

    return Promise.resolve("Table created successfully");
  } catch (e) {
    return Promise.reject(e);
  }
}

// get menu item details of particualr menu id and restaurant id
async function getMenuItemDetails(cartItemInput) {
  const id = cartItemInput.restaurantId;
  const sortKey = cartItemInput.menuItemId;

  const params = {
    TableName: DDBTables.restauranttable,
    KeyConditionExpression: "#Id = :ID_val AND #SortKey = :SORTKEY_val",
    ExpressionAttributeNames: {
      "#Id": "id",
      "#SortKey": "sortKey",
    },
    ExpressionAttributeValues: {
      ":ID_val": id,
      ":SORTKEY_val": sortKey,
    },
  };

  return dynamobdHandler.getTableItems(params);
}

// get cart list
// async function getCartlist(isGetDetails) {
//   let params;
//   if (isGetDetails) {
//     params = {
//       TableName: DDBTables.cartTable,
//     };
//   }

//   return dynamobdHandler.getList(params);
// }

// async function getCart(cartId, cartSortKey) {
//   const id = cartId;
//   const sortKey = cartSortKey;

//   // let params;

//   const params = {
//     TableName: DDBTables.cartTable,
//     KeyConditionExpression: '#Id = :ID_val AND #SortKey = :SORTKEY_val',
//     ExpressionAttributeNames: {
//       '#Id': 'id',
//       '#SortKey': 'sortKey',
//     },
//     ExpressionAttributeValues: {
//       ':ID_val': id,
//       ':SORTKEY_val': sortKey,
//     },
//   };

//   return dynamobdHandler.getTableItems(params);
// }

async function updateCart(updatedCartItems) {
  return dynamobdHandler.updateItemsQuery(
    updatedCartItems,
    DDBTables.cartTable
  );
}

async function getOrderById(orderId) {
  const id = orderId;
  const params = {
    TableName: DDBTables.orderTable,
    KeyConditionExpression: "#Id = :ID_val",
    ExpressionAttributeNames: {
      "#Id": "id",
    },
    ExpressionAttributeValues: {
      ":ID_val": id,
    },
  };

  return dynamobdHandler.getTableItems(params);
}
// delete cart item
async function deleteCartItem(inputData) {
  const tableName = DDBTables.cartTable;
  const id = inputData.cartId;
  const sortKey = inputData.cartItemId;
  const params = {
    TableName: tableName,
    Key: {
      id,
      sortKey,
    },
  };
  try {
    await dynamobdHandler.deleteItem(params);
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
}

// update order
async function updateOrder(newOrder) {
  const { orderTable } = DDBTables;
  try {
    const dbResult = await dynamobdHandler.updateItemsQuery(
      newOrder,
      orderTable
    );

    return Promise.resolve(dbResult);
  } catch (e) {
    return Promise.reject(e);
  }
}
// get cartItem
async function getCartItem(cartId, cartItemId) {
  const { cartTable } = DDBTables;
  let cartItem;
  const params = {
    TableName: cartTable,
    KeyConditionExpression: "id = :cartId AND sortKey = :cartItemId",
    ExpressionAttributeValues: {
      ":cartId": cartId,
      ":cartItemId": cartItemId,
    },
  };
  try {
    cartItem = await dynamobdHandler.getTableItems(params);

    return Promise.resolve(cartItem);
  } catch (e) {
    return Promise.reject(e);
  }
}
/**
 * This method is responsible for updating cartItem details
 * @param {Object} updatedInput The object that could be updated
 * @returns It will return updated object if successfully updated, otherwise return error.
 */
async function updateCartItem(updatedInput) {
  const { cartTable } = DDBTables;
  try {
    const dbResult = await dynamobdHandler.updateItemsQuery(
      updatedInput,
      cartTable
    );

    return Promise.resolve(dbResult.Attributes);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function getDeliveryDetailsByUserId(input) {
  let order;

  const params = {
    TableName: DDBTables.orderTable,
    FilterExpression: "userId= :userboyid",
    ExpressionAttributeValues: { ":userboyid": input.userId },
  };
  try {
    order = await dynamobdHandler.getItem(params);
  } catch (e) {
    logger.info(`error in lib ${e}`);
  }
  const filteredList = order.Items.filter((item) =>
    item.sortKey.startsWith("#Delivery#")
  );

  return filteredList;
}

/**
 * This method is responsible for fetching cart details by cartId from DB.
 * @param {String} cartId This String contains the cartId
 * @returns It should return cart object if found, otherwise it return error.
 */
async function getCart(cartId) {
  const { cartTable } = DDBTables;
  let cart;
  const params = {
    TableName: cartTable,
    KeyConditionExpression: "id = :cartId",
    ExpressionAttributeValues: {
      ":cartId": cartId,
    },
  };
  try {
    cart = await dynamobdHandler.getTableItems(params);

    return Promise.resolve(cart);
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * This method is responsible for batch writing of items in order table.
 * @param {Array} dataArray This Array contains the details of order item.
 * @returns It should return order object.
 */
async function createOrder(dataArray, deleteCartItems) {
  const transactItems = [];
  let isSuccessfull;
  dataArray.forEach((element) => {
    const transactElement = element;
    const { tableName } = transactElement;
    delete transactElement.tableName;
    const transactItem = {
      Put: {
        Item: transactElement,
        TableName: tableName,
      },
    };
    transactItems.push(transactItem);
  });
  deleteCartItems.forEach((element) => {
    const tableName = DDBTables.cartTable;
    const transactItem = {
      Delete: {
        TableName: tableName,
        Key: {
          id: element.id,
          sortKey: element.sortKey,
        },
      },
    };
    transactItems.push(transactItem);
  });
  try {
    isSuccessfull = await dynamobdHandler.transactionWriteItem(transactItems);

    return isSuccessfull;
  } catch (error) {
    return error;
  }
}

async function updateOrderStatusByTransactions(transactItems) {
  let isSuccessfull;
  try {
    isSuccessfull = await dynamobdHandler.transactionWriteItem(transactItems);

    return isSuccessfull;
  } catch (error) {
    return error;
  }
}

async function getDeliveryList(deliveryBoyId) {
  const params = {
    TableName: DDBTables.delivery,
    FilterExpression: "#deliveryBoyId = :deliveryBoyId",
    ExpressionAttributeNames: {
      "#deliveryBoyId": "deliveryBoyId",
    },
    ExpressionAttributeValues: {
      ":deliveryBoyId": deliveryBoyId,
    },
  };

  try {
    const result = await dynamobdHandler.getList(params);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getDeliveryListbyorderid(orderId) {
  const params = {
    TableName: DDBTables.delivery,
    FilterExpression: "#deliveryBoyId = :deliveryBoyId",
    ExpressionAttributeNames: {
      "#deliveryBoyId": "id",
    },
    ExpressionAttributeValues: {
      ":deliveryBoyId": orderId,
    },
  };

  try {
    const result = await dynamobdHandler.getList(params);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getOrderItemsById(orderId) {
  const params = {
    TableName: DDBTables.orderTable,
    KeyConditionExpression:
      "#id = :order_id and begins_with(#sort_key, :sortKeyStart)",
    ExpressionAttributeNames: {
      "#id": "id",
      "#sort_key": "sortKey",
    },
    ExpressionAttributeValues: {
      ":order_id": orderId,
      ":sortKeyStart": "#ORDER",
    },
  };

  return dynamobdHandler.getTableItems(params);
}
/**
 * This method is responsible for fetching all the delivery boys.
 * @returns It should return Array of delivery boys.
 */
async function getDeliveryBoys() {
  let deliveryboys = [];
  const params = {
    TableName: DDBTables.userTable,
    FilterExpression: "#user_type = :user_type_val",
    ExpressionAttributeNames: {
      "#user_type": "userType",
    },
    ExpressionAttributeValues: { ":user_type_val": "DeliveryBoy" },
  };
  try {
    deliveryboys = await dynamobdHandler.getList(params);

    return deliveryboys;
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getRestaurantDetailsByIndex(input) {
  let restaurant = [];
  const table = DDBTables.restauranttable;

  const params = {
    TableName: table,
    IndexName: "id-category-index",
    KeyConditionExpression: "#id = :id_val  and #category = :category_val",
    ExpressionAttributeNames: {
      "#category": "category",
      "#id": "id",
    },
    ExpressionAttributeValues: {
      ":id_val": input.restaurantId,
      ":category_val": input.category,
    },
  };

  try {
    restaurant = await dynamobdHandler.getTableItems(params);

    return restaurant;
  } catch (error) {
    return Promise.reject(error);
  }
}
/**
 * This method is responsible for fetching all the billing details by userId.
 * @param {String} userId This String contains the userId.
 * @returns It should return Array of billing details by userId.
 */
async function getBillingDetailsByUserId(userId) {
  let billingDetailsArr = [];
  const params = {
    TableName: DDBTables.billingTable,
    FilterExpression: "#userId = :userId",
    ExpressionAttributeNames: {
      "#userId": "userId",
    },
    ExpressionAttributeValues: { ":userId": userId },
  };
  try {
    billingDetailsArr = await dynamobdHandler.getList(params);

    return billingDetailsArr;
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getBillingDetailsByOrderId(orderId) {
  let params = {};
  let billingObj = [];

  params = {
    TableName: DDBTables.billingTable,
    KeyConditionExpression: "#Id = :ID_val",
    ExpressionAttributeNames: {
      "#Id": "id",
    },
    ExpressionAttributeValues: {
      ":ID_val": orderId,
    },
  };

  try {
    billingObj = await dynamobdHandler.getTableItems(params);

    return billingObj;
  } catch (error) {
    return Promise.reject(error);
  }
}

async function getUserByEmailId(email) {
  const params = {
    TableName: DDBTables.userTable,
    FilterExpression: "#email = :email",
    ExpressionAttributeNames: {
      "#email": "email",
    },
    ExpressionAttributeValues: {
      ":email": email,
    },
  };

  try {
    const result = await dynamobdHandler.getList(params);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

// Function to get Quotes based on search filter.
function filterQuerry(inputKey) {
  const quotationTableName = DDBTables.restauranttable;

  const params = {
    TableName: quotationTableName,
    KeyConditionExpression: "#id = :id_val",
    ExpressionAttributeNames: {
      "#id": "id",
    },
    ExpressionAttributeValues: {
      ":id_val": inputKey.id,
    },
  };

  // Condition for category
  if (inputKey.category) {
    params.FilterExpression = "#category = :category";
    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;
  }

  // Condition for discount
  if (inputKey.discount) {
    params.FilterExpression = "#discount = :discount";
    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;
  }

  // Condition for menuItemName
  if (inputKey.menuItemName) {
    params.FilterExpression = "#menuItemName = :menuItemName";
    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;
  }

  // Condition for name
  if (inputKey.name) {
    params.FilterExpression = "#price = :price";
    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for rating
  if (inputKey.rating) {
    params.FilterExpression = "#rating = :rating";
    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount
  if (inputKey.category && inputKey.discount) {
    params.FilterExpression = "#category = :category AND #discount = :discount";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;
  }

  // Condition for category && menuItemName
  if (inputKey.category && inputKey.menuItemName) {
    params.FilterExpression =
      "#category = :category AND #menuItemName = :menuItemName";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;
  }

  // Condition for category && rating
  if (inputKey.category && inputKey.rating) {
    params.FilterExpression = "#category = :category AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && name
  if (inputKey.category && inputKey.name) {
    params.FilterExpression = "#category = :category AND #price = :price";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for discount && menuItemName
  if (inputKey.discount && inputKey.menuItemName) {
    params.FilterExpression =
      "#discount = :discount AND #menuItemName = :menuItemName";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;
  }

  // Condition for discount && rating
  if (inputKey.discount && inputKey.rating) {
    params.FilterExpression = "#discount = :discount AND #rating = :rating";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for discount && name
  if (inputKey.discount && inputKey.name) {
    params.FilterExpression = "#discount = :discount AND #price = :price";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for menuItemName && rating
  if (inputKey.menuItemName && inputKey.rating) {
    params.FilterExpression =
      "#menuItemName = :menuItemName AND #rating = :rating";

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for menuItemName && name
  if (inputKey.menuItemName && inputKey.name) {
    params.FilterExpression =
      "#menuItemName = :menuItemName AND #price = :price";

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for name && rating
  if (inputKey.name && inputKey.rating) {
    params.FilterExpression = "#price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount && menuItemName
  if (inputKey.category && inputKey.discount && inputKey.menuItemName) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #menuItemName = :menuItemName";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;
  }

  // Condition for category && discount && rating
  if (inputKey.category && inputKey.discount && inputKey.rating) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount && name
  if (inputKey.category && inputKey.discount && inputKey.name) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #price = :price";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for discount && menuItemName && rating
  if (inputKey.discount && inputKey.menuItemName && inputKey.rating) {
    params.FilterExpression =
      "#discount = :discount AND #menuItemName = :menuItemName AND #rating = :rating";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for discount && menuItemName && name
  if (inputKey.discount && inputKey.menuItemName && inputKey.name) {
    params.FilterExpression =
      "#discount = :discount AND #menuItemName = :menuItemName AND #price = :price";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for menuItemName && name && rating
  if (inputKey.menuItemName && inputKey.name && inputKey.rating) {
    params.FilterExpression =
      "#menuItemName = :menuItemName AND #price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for category && discount && menuItemName && rating
  if (
    inputKey.category &&
    inputKey.discount &&
    inputKey.menuItemName &&
    inputKey.rating
  ) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #menuItemName = :menuItemName AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount && menuItemName && name
  if (
    inputKey.category &&
    inputKey.discount &&
    inputKey.menuItemName &&
    inputKey.name
  ) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #menuItemName = :menuItemName AND #price = :price";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;
  }

  // Condition for category && menuItemName && name && rating
  if (
    inputKey.category &&
    inputKey.menuItemName &&
    inputKey.name &&
    inputKey.rating
  ) {
    params.FilterExpression =
      "#category = :category AND #menuItemName = :menuItemName AND #price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount && name && rating
  if (
    inputKey.category &&
    inputKey.discount &&
    inputKey.name &&
    inputKey.rating
  ) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for discount && menuItemName && name && rating
  if (
    inputKey.discount &&
    inputKey.menuItemName &&
    inputKey.name &&
    inputKey.rating
  ) {
    params.FilterExpression =
      "#discount = :discount AND #menuItemName = :menuItemName AND #price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  // Condition for category && discount && menuItemName && name && rating
  if (
    inputKey.category &&
    inputKey.discount &&
    inputKey.menuItemName &&
    inputKey.name &&
    inputKey.rating
  ) {
    params.FilterExpression =
      "#category = :category AND #discount = :discount AND #menuItemName = :menuItemName AND #price = :price AND #rating = :rating";

    params.ExpressionAttributeNames["#category"] = "category";
    params.ExpressionAttributeValues[":category"] = inputKey.category;

    params.ExpressionAttributeNames["#discount"] = "discount";
    params.ExpressionAttributeValues[":discount"] = inputKey.discount;

    params.ExpressionAttributeNames["#menuItemName"] = "menuItemName";
    params.ExpressionAttributeValues[":menuItemName"] = inputKey.menuItemName;

    params.ExpressionAttributeNames["#price"] = "price";
    params.ExpressionAttributeValues[":price"] = inputKey.name;

    params.ExpressionAttributeNames["#rating"] = "rating";
    params.ExpressionAttributeValues[":rating"] = inputKey.rating;
  }

  return dynamobdHandler.getTableItems(params);
}

async function createMenuItemByExcelFile(dataArray) {
  const TableName = DDBTables.restauranttable;

  try {
    const result = await dynamobdHandler.batchWriteItem(TableName, dataArray);

    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

async function filterQuerryOnRestaurant(inputData) {
  const elementsArray = Object.entries(inputData);
  let FilterExpression = " ";
  const ExpressionAttributeValues = {};
  const ExpressionAttributeNames = {};
  const operator = "and";
  const str = "#";
  elementsArray.forEach((element) => {
    FilterExpression =
      `${FilterExpression} ` +
      `${str}` +
      `${element[0]} = :${element[0]}` +
      ` ${operator}`;

    ExpressionAttributeNames[`${str}` + `${element[0]}`] = element[0];
    ExpressionAttributeValues[`:${element[0]}`] = element[1];
  });
  FilterExpression = FilterExpression.substring(0, FilterExpression.length - 3);

  const params = {
    TableName: DDBTables.restauranttable,
    FilterExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
  };

  return dynamobdHandler.getItem(params);
  //  /let order = await dynamobdHandler.getItem(params);
}

async function getRestaurantByUserId(userId) {
  const params = {
    TableName: DDBTables.restauranttable,
    FilterExpression: "#userId = :userId",
    ExpressionAttributeNames: {
      "#userId": "userId",
    },
    ExpressionAttributeValues: {
      ":userId": userId,
    },
  };
  try {
    const result = await dynamobdHandler.getList(params);
    return Promise.resolve(result);
  } catch (error) {
    return Promise.reject(error);
  }
}

async function deliveryupdatedOrder(newOrder) {
  const { delivery } = DDBTables.delivery;
  try {
    const dbResult = await dynamobdHandler.updateItemsQuery(newOrder, delivery);

    return Promise.resolve(dbResult);
  } catch (e) {
    return Promise.reject(e);
  }
}

async function getDeliveryByOrderId(orderId) {
  const { delivery } = DDBTables;
  let deliveryItem;
  const params = {
    TableName: delivery,
    KeyConditionExpression: "id = :orderId",
    ExpressionAttributeValues: {
      ":orderId": orderId,
    },
  };
  try {
    deliveryItem = await dynamobdHandler.getTableItems(params);

    return Promise.resolve(deliveryItem);
  } catch (e) {
    return Promise.reject(e);
  }
}

module.exports = {
  getDeliveryByOrderId,
  writeRestaurant,
  getRestaurantDetails,
  writeMenuItem,
  deleteUser,
  getUserByUserId,
  writeUser,
  updateUser,
  getUserList,
  deleteMenuItem,
  getRestaurantList,
  getRestaurantById,
  updateMenuItem,
  updateRestaurant,
  deleteRestaurant,
  addItemsToCart,
  createCart,
  getCartlist,
  deleteCartItem,
  updateOrder,
  updateCartItem,
  getCartItem,
  userLogin,
  getMenuItemDetails,
  getCart,
  createOrder,
  updateCart,
  getOrderById,
  getCartItemsDetails,
  getDeliveryBoys,
  getDeliveryDetailsByUserId,
  getDeliveryList,
  getOrderItemsById,
  getBillingDetailsByUserId,
  getOrderListUserId,
  getBillingDetailsByOrderId,
  getUserByEmailId,
  filterQuerry,
  createMenuItemByExcelFile,
  filterQuerryOnRestaurant,
  getRestaurantByUserId,
  getOrderListByRestaurantId,
  deliveryupdatedOrder,
  getRestaurantDetailsByIndex,
  updateOrderStatusByTransactions,
};
