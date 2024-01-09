const deliveryHandler = require('../handlerservices/delivery/delivery-handler');

const resolvers = {

  Update: {
    updateDeliveryDetails: (ctx) => deliveryHandler.updateDeliveryDetails(ctx.argument, ctx.request),
  },

};

async function deliveryResolverHandler(event) {
  
  const typeHandler = resolvers[event.typeName];

  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    if (resolver) {
      const result = await resolver(event);
      return result;
    }
  }
  throw new Error('Resolver not found 2 yes I am Keshav');
}

module.exports = {
  deliveryResolverHandler,
};
