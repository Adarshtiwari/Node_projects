
'use strict';
let orderHandler = require('../handlerservices/order/order-handler');
let deliveryHandler = require("../handlerservices/delivery/delivery-handler");
const resolvers = {

  Update: {
    updateOrder: (ctx) => {
      return orderHandler.updateOrder(ctx.argument, ctx.request);
    },
    updateDeliveryDetails: (ctx) => {
      return deliveryHandler.updateDeliveryDetails(ctx.argument, ctx.request);
    },

    updateOrderStatus: (ctx) => {
      return orderHandler.updateOrderStatus(ctx.argument, ctx.request);
    }

  },

  Create: {
    createOrder: (ctx) => orderHandler.createOrder(ctx.argument, ctx.request),
  },
    Query: {
        listOrderById: (ctx) => {
            return orderHandler.listOrderById(ctx.argument, ctx.request);
          },

          getOrderListUserId: (ctx) => 
          {
           return orderHandler.getOrderListUserId(ctx.argument, ctx.request);
          },

          getDeliveryDetailsByDeliveryBoyId: (ctx) => {
            return orderHandler.getDeliveryDetailsByDeliveryBoyId(ctx.argument, ctx.request);
          },

          getDeliveryDetailsByUserId: (ctx) => {
              return deliveryHandler.getDeliveryDetailsByUserId(ctx.argument, ctx.request);
            },

            getOrderListByRestaurantId: (ctx) => {
              return orderHandler.getOrderListByRestaurantId(ctx.argument, ctx.request);
            },
        
          
    }
}

async function orderResolverHandler(event) {

  const typeHandler = resolvers[event.typeName];

  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    if (resolver) {
      const result = await resolver(event);
      return result;
    }
  }
  throw new Error('Resolver not found 2 inside order');
}

module.exports = {
  orderResolverHandler,
};
