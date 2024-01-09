const appLogger = require('./custom_modules/applog-handler');
const constant = require('./constants');

function getRequestUserID(requestData) {
  let userID = 'none';
  if (requestData && requestData.headers && requestData.headers.userid) {
    userID = requestData.headers.userid;
  }
  return userID;
}

function getRequestAppName(requestData) {
  let appname = 'fda';

  if (requestData && requestData.headers && requestData.headers.appname) {
    appname = requestData.headers.appname;
  }

  return appname;
}
exports.getRandomFromArray = (list) => list[Math.floor((Math.random() * list.length))];

exports.createTransactionParamForUpdateOrderStatus = (order, deliveryBoy, delivery, billing) => {
  const tableName = constant.DDBTables;
  const TransactItems = [
    {
      Update: {
        TableName: tableName.order,
        Key: {
          id: order.id,
          sortKey: order.sortKey,
        },
        UpdateExpression: 'SET #orderStatus = :orderStatus',
        ExpressionAttributeNames: {
          '#orderStatus': 'orderStatus',
        },
        ExpressionAttributeValues: {
          ':orderStatus': order.orderStatus,
        },
      },
    },
    {
      Update: {
        TableName: tableName.user,
        Key: {
          id: deliveryBoy.id,
        },
        UpdateExpression: 'SET #deliveryBoyStatus = :deliveryBoyStatus',
        ExpressionAttributeNames: {
          '#deliveryBoyStatus': 'deliveryBoyStatus',
        },
        ExpressionAttributeValues: {
          ':deliveryBoyStatus': deliveryBoy.deliveryBoyStatus,
        },
      },
    },
    {
      Put: {
        TableName: tableName.delivery,
        Item: delivery,
      },
    },
    {
      Put: {
        TableName: tableName.billing,
        Item: billing,
      },
    },
  ];
  return TransactItems;
};

exports.orderOutForDeliveryTransaction = (order) => {
  const tableName = constant.DDBTables;
  const TransactItems = [
    {
      Update: {
        TableName: tableName.order,
        Key: {
          id: order.id,
          sortKey: order.sortKey,
        },
        UpdateExpression: 'SET #orderStatus = :orderStatus',
        ExpressionAttributeNames: {
          '#orderStatus': 'orderStatus',
        },
        ExpressionAttributeValues: {
          ':orderStatus': order.orderStatus,
        },
      },
    },
    {
      Update: {
        TableName: tableName.delivery,
        Key: {
          id: order.id,
        },
        UpdateExpression: 'SET #deliveryStatus = :deliveryStatus, #pickUpTime = :pickUpTime',
        ExpressionAttributeNames: {
          '#deliveryStatus': 'deliveryStatus',
          '#pickUpTime': 'pickUpTime',
        },
        ExpressionAttributeValues: {
          ':deliveryStatus': constant.deliveryStatus.OnTheWay,
          ':pickUpTime': new Date().toISOString(),
        },
      },
    },
  ];
  return TransactItems;
};

exports.deliveredTransaction = (order, user) => {
  const tableName = constant.DDBTables;
  const TransactItems = [
    {
      Update: {
        TableName: tableName.order,
        Key: {
          id: order.id,
          sortKey: order.sortKey,
        },
        UpdateExpression: 'SET #orderStatus = :orderStatus, #isPaid = :isPaid',
        ExpressionAttributeNames: {
          '#orderStatus': 'orderStatus',
          '#isPaid': 'isPaid',
        },
        ExpressionAttributeValues: {
          ':orderStatus': order.orderStatus,
          ':isPaid': order.isPaid,

        },
      },
    },
    {
      Update: {
        TableName: tableName.delivery,
        Key: {
          id: order.id,
        },
        UpdateExpression: 'SET #deliveryStatus = :deliveryStatus, #deliveredTime = :deliveredTime',
        ExpressionAttributeNames: {
          '#deliveryStatus': 'deliveryStatus',
          '#deliveredTime': 'deliveredTime',
        },
        ExpressionAttributeValues: {
          ':deliveryStatus': constant.deliveryStatus.Delivered,
          ':deliveredTime': new Date().toISOString(),
        },
      },
    },
    {
      Update: {
        TableName: tableName.user,
        Key: {
          id: user.id,
        },
        UpdateExpression: 'SET #deliveryBoyStatus = :deliveryBoyStatus',
        ExpressionAttributeNames: {
          '#deliveryBoyStatus': 'deliveryBoyStatus',
        },
        ExpressionAttributeValues: {
          ':deliveryBoyStatus': user.deliveryBoyStatus,

        },
      },
    },
  ];
  return TransactItems;
};

exports.failedDeliveryTransaction = (order, delivery, user) => {
  const tableName = constant.DDBTables;
  const TransactItems = [
    {
      Update: {
        TableName: tableName.order,
        Key: {
          id: order.id,
          sortKey: order.sortKey,
        },
        UpdateExpression: 'SET #orderStatus = :orderStatus',
        ExpressionAttributeNames: {
          '#orderStatus': 'orderStatus',
        },
        ExpressionAttributeValues: {
          ':orderStatus': order.orderStatus,

        },
      },
    },
    {
      Update: {
        TableName: tableName.delivery,
        Key: {
          id: order.id,
        },
        UpdateExpression: 'SET #deliveryStatus = :deliveryStatus',
        ExpressionAttributeNames: {
          '#deliveryStatus': 'deliveryStatus',
        },
        ExpressionAttributeValues: {
          ':deliveryStatus': delivery.deliveryStatus,
        },
      },
    },
    {
      Update: {
        TableName: tableName.user,
        Key: {
          id: user.id,
        },
        UpdateExpression: 'SET #deliveryBoyStatus = :deliveryBoyStatus',
        ExpressionAttributeNames: {
          '#deliveryBoyStatus': 'deliveryBoyStatus',
        },
        ExpressionAttributeValues: {
          ':deliveryBoyStatus': user.deliveryBoyStatus,

        },
      },
    },
  ];
  return TransactItems;
};

exports.writeToCloudWatch = (action, inputData, requestHdr, state, logid, errorInfo) => {
  const userID = getRequestUserID(requestHdr);
  const logappName = getRequestAppName(requestHdr);

  const logItem = {
    appName: logappName,
    userid: userID,
    logid,
    action,
    state,
    errorInfo,
    datetime: new Date(),
    requestData: inputData,
  };

  return appLogger.writeToCloudWatch(logappName, userID, logItem);
};

/**
 * This method is responsible for genrating random number of 10 digit.
 */
exports.genrateTenDigitRandomeNumber = () => Math.floor(
  Math.random() * (9999999999 - 1000000000 + 1) + 1000000000,
);
