const cartHandler = require("../handlerservices/cart/cart-handler");
const userHandler = require("../handlerservices/user/user-handler");
const catrItemHandler = require("../handlerservices/cart/cart-item-handler");
const logger = require("../../lib/logger");

const resolvers = {
  Create: {
    addItemToCart: (ctx) =>
      cartHandler.createCartItem(ctx.argument, ctx.request),
  },

  Delete: {
    deleteCartItem: (ctx) =>
      cartHandler.deleteCartItem(ctx.argument, ctx.request),
  },
  Update: {
    updateCartItem: (ctx) =>
      catrItemHandler.updateCartItem(ctx.argument, ctx.request),
  },
  Query: {
    getCartlist: (ctx) => cartHandler.getCartlist(ctx.argument, ctx.request),
  },
};

async function cartResolverHandler(event) {
  const typeHandler = resolvers[event.typeName];
  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    if (resolver) {
      const result = await resolver(event);
      return result;
    }
  }
  throw new Error("Resolver not found 2");
}

module.exports = {
  cartResolverHandler,
};
