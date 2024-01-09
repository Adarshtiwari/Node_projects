const userHandler = require('../handlerservices/user/user-handler');

const resolvers = {
  Query: {
    getUser: (ctx) => userHandler.getUser(ctx.argument, ctx.request),
    getUserList: (ctx) => userHandler.getUserList(ctx.argument, ctx.request),

    listDeliveryBoy: (ctx) => userHandler.listDeliveryBoy(ctx.argument, ctx.request),
  },

  Delete: {
    deleteUser: (ctx) => userHandler.deleteUser(ctx.argument, ctx.request),
  },

  Create: {
    createUser: (ctx) => userHandler.createUser(ctx.argument, ctx.request),

  },

  Update: {
    updateUser: (ctx) => userHandler.updateUser(ctx.argument, ctx.request),
  },

  Login: {
    userLogin: (ctx) => userHandler.userLogin(ctx.argument, ctx.request),
  },
};

async function userResolverHandler(event) {
 
  const typeHandler = resolvers[event.typeName];

  if (typeHandler) {
    const resolver = typeHandler[event.fieldName];
    if (resolver) {
      const result = await resolver(event);
      return result;
    }
  }
  throw new Error('Resolver not found 2');
}

module.exports = {
  userResolverHandler,
};
