const billingHandler = require("../handlerservices/billing/billing-handler");

const resolvers = {
  Query: {
    getBillingDetailsByUserId: (ctx) =>
      billingHandler.getBillingDetailsByUserId(ctx.argument, ctx.request),
    getBillingDetailsByOrderId: (ctx) =>
      billingHandler.getBillingDetailsByOrderId(ctx.argument, ctx.request),
  },
};

async function BillingResolverHandler(event) {
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
  BillingResolverHandler,
};
