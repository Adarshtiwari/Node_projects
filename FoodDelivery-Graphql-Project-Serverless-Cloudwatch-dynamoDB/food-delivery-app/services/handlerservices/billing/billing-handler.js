// /* eslint-disable import/no-unresolved */
// const { uuid } = require('uuidv4');
// const dynamobdHelper = require('../../../lib/dynamodb-helper');
// const util = require('../../../lib/util');
// const Constant = require('../../../lib/constants');

// async function getBillingDetailsByUserId(input, request) {
//   const logid = uuid();
//   // App logs
//   await util.writeToCloudWatch('getBillingDetailsByUserId', input, request, Constant.logstate.initial, logid, null);

//   let result;
//   const billingArr = [];
//   try {
//     // fetching billing details
//     result = await dynamobdHelper.getBillingDetailsByUserId(input.userId);
//     await util.writeToCloudWatch('Fetching billing details by userId', result, request, Constant.logstate.success, logid, null);
//   } catch (error) {
//     await util.writeToCloudWatch('Error while fetching billing details', null, request, Constant.logstate.failure, logid, error);
//     return Promise.reject(error);
//   }

//   // mapping billing reponse object
//   result.forEach((element) => {
//     const billing = element;
//     billing.orderId = element.id;
//     delete billing.id;
//     billingArr.push(billing);
//   });
//   return billingArr;
// }

// // get billing details by order id
// async function getBillingDetailsByOrderId(input, request) {
//   const logid = uuid();
//   // App logs
//   await util.writeToCloudWatch('getBillingDetailsByOrderId', input, request, Constant.logstate.initial, logid, null);
//   let result;
//   try {
//     result = await dynamobdHelper.getBillingDetailsByOrderId(input.orderId);
//     await util.writeToCloudWatch('Fetching billing details by orderId', result, request, Constant.logstate.success, logid, null);
//     if (!result.Items.length && !result.Count) {
//       return Promise.reject(new Error('Invalid Order Id'));
//     }
//   } catch (error) {
//     await util.writeToCloudWatch('Error while fetching billing details by orderId', null, request, Constant.logstate.failure, logid, error);
//     return Promise.reject(error);
//   }

//   result.Items[0].orderId = result.Items[0].id;
//   delete result.Items[0].id;

//   return Promise.resolve(result.Items[0]);
// }

// module.exports = {
//   getBillingDetailsByUserId,
//   getBillingDetailsByOrderId,
// };
