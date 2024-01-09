/* eslint-disable no-param-reassign */
/* eslint-disable no-await-in-loop */
const AWS = require("aws-sdk");

const docClient = new AWS.DynamoDB.DocumentClient();

module.exports.putInTable = async (dataItem, tableName) =>
  new Promise((resolve, reject) => {
    const params = {
      TableName: tableName,
      Item: dataItem,
    };

    docClient.put(params, (err, res) => {
      if (err == null) {
        resolve(res);
      } else {
        reject(new Error("Unable to upload data"));
      }
    });
  });

module.exports.getTableItems = (params) =>
  new Promise((resolve, reject) => {
    docClient.query(params, (err, data) => {
      if (err) {
        // an error occurred
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

module.exports.deleteItem = async (params) =>
  new Promise((resolve, reject) => {
    docClient.delete(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

module.exports.updateItemsQuery = (dataItem, tableName) => {
  const IDKeyValue = dataItem.id;
  const sortKeyalue = dataItem.sortKey;
  const objValues = dataItem;
  delete objValues.sortKey;
  delete objValues.id;
  const elementsArray = Object.entries(objValues);
  let contextExpression = " ";
  const contextValue = {};
  const contextExpressionNames = {};
  if (elementsArray.length > 0) {
    contextExpression = "set";
    elementsArray.forEach((element) => {
      contextExpression =
        `${contextExpression} ` + `#${element[0]} = :${element[0]},`;
      contextValue[`:${element[0]}`] = element[1];
      contextExpressionNames[`#${element[0]}`] = element[0];
    });
    contextExpression = contextExpression.substring(
      0,
      contextExpression.length - 1
    );
  }
  const params = {
    TableName: tableName,
    Key: {
      id: IDKeyValue,
      sortKey: sortKeyalue,
    },
    UpdateExpression: contextExpression,
    ExpressionAttributeNames: contextExpressionNames,
    ExpressionAttributeValues: contextValue,
    ReturnValues: "ALL_NEW",
  };
  return new Promise((resolve, reject) => {
    docClient.update(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports.updateItemsQuerybyPK = (dataItem, tableName) => {
  const IDKeyValue = dataItem.id;
  const objValues = dataItem;
  delete objValues.id;
  const elementsArray = Object.entries(objValues);
  let contextExpression = " ";
  const contextValue = {};
  const contextExpressionNames = {};
  if (elementsArray.length > 0) {
    contextExpression = "set";
    elementsArray.forEach((element) => {
      contextExpression =
        `${contextExpression} ` + `#${element[0]} = :${element[0]},`;
      contextValue[`:${element[0]}`] = element[1];
      contextExpressionNames[`#${element[0]}`] = element[0];
    });
    contextExpression = contextExpression.substring(
      0,
      contextExpression.length - 1
    );
  }
  const params = {
    TableName: tableName,
    Key: {
      id: IDKeyValue,
    },
    UpdateExpression: contextExpression,
    ExpressionAttributeNames: contextExpressionNames,
    ExpressionAttributeValues: contextValue,
    ReturnValues: "ALL_NEW",
  };

  return new Promise((resolve, reject) => {
    docClient.update(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

module.exports.getList = async (params) => {
  const scanResults = [];
  let items;
  do {
    items = await docClient.scan(params).promise();
    items.Items.forEach((item) => scanResults.push(item));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  return scanResults;
};

module.exports.getItem = async (params) =>
  new Promise((resolve, reject) => {
    const documentClient = new AWS.DynamoDB.DocumentClient();
    documentClient.scan(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });

function chunks(inputArray, perChunk) {
  return inputArray.reduce((all, one, i) => {
    const ch = Math.floor(i / perChunk);
    all[ch] = [].concat(all[ch] || [], one);
    return all;
  }, []);
}

/**
 * This method is responsible or deleting all the items for given partition key.
 * @param {String} tableName This String contains the name of the table.
 * @param {import("aws-sdk/clients/batch").String} partitionId This String contains the partition key.
 * @returns It will return the deleted object.
 */
module.exports.deleteAllItemsByPartitionKey = async (
  tableName,
  partitionId
) => {
  let obj = {};
  const queryParams = {
    TableName: tableName,
    KeyConditionExpression: "id = :partitionId",
    ExpressionAttributeValues: { ":partitionId": partitionId },
  };

  const queryResults = await docClient.query(queryParams).promise();
  if (queryResults.Items && queryResults.Items.length > 0) {
    const batchCalls = chunks(queryResults.Items, 25).map(async (chunk) => {
      const deleteRequests = chunk.map((item) => {
        const tempKey = item.id;
        const partitionKey = `#${tempKey}`;
        if (partitionKey === item.sortKey) {
          obj = item;
        }
        return {
          DeleteRequest: {
            Key: {
              id: item.id,
              sortKey: item.sortKey,
            },
          },
        };
      });

      const batchWriteParams = {
        RequestItems: {
          [tableName]: deleteRequests,
        },
      };
      await docClient.batchWrite(batchWriteParams).promise();
    });

    await Promise.all(batchCalls);
  }
  return obj;
};

/**
 * This method is responsible for batch writing of item in a table
 * @param {String} tableName This String contains the table name
 * @param {Array} dataArray The array for which batch writing to be perform
 * @returns It should return order object if successfully write items, otherwise return error.
 */
module.exports.batchWriteItem = async (tableName, dataArray) => {
  let obj;
  try {
    if (dataArray && dataArray.length > 0) {
      const batchCalls = chunks(dataArray, 25).map(async (chunk) => {
        const putRequests = chunk.map((item) => {
          const tempKey = item.id;
          const partitionKey = `#${tempKey}`;
          if (partitionKey === item.sortKey) {
            obj = item;
          }
          return {
            PutRequest: {
              Item: item,
            },
          };
        });

        const batchWriteParams = {
          RequestItems: {
            [tableName]: putRequests,
          },
        };
        await docClient.batchWrite(batchWriteParams).promise();
      });

      await Promise.all(batchCalls);
    }
    return obj;
  } catch (error) {
    return error;
  }
};

/**
 * This method is responsible for write items in transaction way.
 * @param {Array} dataArray This array contains the data of operation to be performed in transaction way.
 * @returns It return true if successfully write items, otherwise it return error.
 */
module.exports.transactionWriteItem = async (dataArray) => {
  try {
    if (dataArray && dataArray.length > 0) {
      const batchCalls = chunks(dataArray, 25).map(async (chunk) => {
        const transactWriteParams = {
          TransactItems: chunk,
        };
        await docClient.transactWrite(transactWriteParams).promise();
      });

      await Promise.all(batchCalls);
    }
    return Promise.resolve(true);
  } catch (error) {
    return Promise.reject(error);
  }
};
