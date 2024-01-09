/* eslint no-undef: "error" */
/* eslint-env node */

const httpMethod = {
  POST: "POST",
  GET: "GET",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
};

const DDBTables = {
  user: "fd_table_user",
  delivery: "fd_table_delivery",
  cart: "fd_table_cart",
  cartItems: "fd_table_cartItems",
  order: "fd_table_order",
  orderItems: "fd_table_orderItems",
  restaurant: "fd_table_restaurant",
  address: "fd_table_address",
  billing: "fd_table_billing",
  status: "fd_table_status",
  notification: "fd_table_notification",
  menuItems: "fd_table_menuItems",
};

const itemType = {
  user: "user",
  delivery: "delivery",
  cart: "cart",
  cartItems: "cartItems",
  order: "order",
  orderItems: "orderItems",
  restaurant: "restaurant",
  address: "address",
  billing: "billing",
  status: "status",
  notification: "notification",
  menuItems: "menuItems",
};

const deliveryStatus = {
  Processing: "Processing",
  OnTheWay: "OnTheWay",
  Pending: "Pending",
  Failed: "Failed",
  Delivered: "Delivered",
};

const orderStatus = {
  InProgress: "InProgress",
  Accept: "Accept",
  Reject: "Reject",
  Preparing: "Preparing",
  OutForDelivery: "OutForDelivery",
  Failed: "Failed",
  Delivered: "Delivered",
};

const userType = {
  User: "User",
  DeliveryBoy: "DeliveryBoy",
  RestaurantOwner: "RestaurantOwner",
};

const deliveryBoyStatus = {
  Available: "Available",
  Busy: "Busy",
  OnLeave: "OnLeave",
};

const bucketName = {
  bucketName: "food-delivery-bucket-for-image-saving",
};

const logstate = {
  initial: "initial",
  success: "success",
  failure: "error",
};

const keys = {
  JWTSecreteKey: "da2-6sgdb4fdkbfgvkms2a4yq4lcwm",
};

module.exports = {
  deliveryBoyStatus,
  httpMethod,
  DDBTables,
  itemType,
  deliveryStatus,
  orderStatus,
  userType,
  bucketName,
  logstate,
  keys,
};





