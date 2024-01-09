const restaurantHandler = require("../handlerservices/restaurant/restaurant-handler");
const menuItemHandler = require("../handlerservices/restaurant/menuItem-handler");
const logger= require("../../lib/logger")
const resolvers = {
  Create: {
    createRestaurant: (ctx) =>
      restaurantHandler.createRestaurant(ctx.argument, ctx.request),
    createMenuItem: (ctx) =>
      menuItemHandler.createMenuItem(ctx.argument, ctx.request),
    createMenuItemByExcelFile: (ctx) =>
      menuItemHandler.createMenuItemByExcelFile(ctx.argument, ctx.request),
  },

  Query: {
    getRestaurantDetails: (ctx) =>
      restaurantHandler.getRestaurantDetails(ctx.argument, ctx.request),

    getMenuItemsByRestaurantId: (ctx) =>
      menuItemHandler.getMenuItemsByRestaurantId(ctx.argument, ctx.request),

    getRestaurantList: (ctx) =>
      restaurantHandler.getRestaurantList(ctx.argument, ctx.request),

    getRestaurantById: (ctx) =>
      restaurantHandler.getRestaurantById(ctx.argument, ctx.request),

    getRestaurantByUserId: (ctx) =>
      restaurantHandler.getRestaurantByUserId(ctx.argument, ctx.request),

    filterQuerry: (ctx) =>
      menuItemHandler.filterQuerry(ctx.argument, ctx.request),

      filterQuerryOnRestaurant: (ctx) =>
      restaurantHandler.filterQuerryOnRestaurant(ctx.argument, ctx.request),


      getRestaurantDetailsByIndex: (ctx) =>
      restaurantHandler.getRestaurantDetailsByIndex(ctx.argument, ctx.request),
      
      },
      
      

  Update: { 
    updateRestaurant: (ctx) =>
      restaurantHandler.updateRestaurant(ctx.argument, ctx.request),

    updateMenuItem: (ctx) =>
      menuItemHandler.updateMenuItem(ctx.argument, ctx.request),

    updateRestaurantRating: (ctx) =>
      restaurantHandler.updateRestaurantRating(ctx.argument, ctx.request),
  },

  Delete: {
    deleteRestaurant: (ctx) =>
      restaurantHandler.deleteRestaurant(ctx.argument, ctx.request),

    deleteMenuItem: (ctx) =>
      menuItemHandler.deleteMenuItem(ctx.argument, ctx.request),
  },
};

async function restaurantResolverHandler(event) {
 
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
  restaurantResolverHandler,
};
