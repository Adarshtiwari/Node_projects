/* eslint-disable import/no-unresolved */
const path = require('path');
const awsXRay = require('aws-xray-sdk');
const AWS = awsXRay.captureAWS(require('aws-sdk'));

// const AWS = require('aws-sdk');
// const awsXRay = require('aws-xray-sdk');
// const ELASTICSEARCH_DOMAIN  = 'search-cg-cm-elasticsearch01-sve3jinqlwbkc3dur2i3ksmbrm.eu-west-1.es.amazonaws.com';
// const ELASTICSEARCH_DOMAIN = process.env.ES_DOMAIN;
// const AWS_REGION = process.env.REGION;

function sendRequest(esDomain, esRegion, httpMethod, requestPath, payload) {


  const endpoint = new AWS.Endpoint(esDomain);
  const httpClient = new AWS.HttpClient();
  const credentials = new AWS.EnvironmentCredentials('AWS');
  const request = new AWS.HttpRequest(endpoint, esRegion);

  request.method = httpMethod;
  request.path = path.join(request.path, requestPath);
  request.headers['Content-Type'] = 'application/json';
  request.headers.Host = esDomain;

  // Append extra line for Post opertion with Bulk mode
  if (httpMethod === 'POST' && payload && requestPath.includes('bulk')) {
    request.body = `${payload.map((json) => JSON.stringify(json)).join('\n')}\n`;
  } else if (httpMethod === 'POST' && payload) {
    request.body = JSON.stringify(payload);
  }

  const signer = new AWS.Signers.V4(request, 'es');
  signer.addAuthorization(credentials, new Date());


  return new Promise((resolve, reject) => {
    httpClient.handleRequest(
      request,
      null,
      (response) => {
        const { statusCode, statusMessage, headers } = response;
        let body = '';
        response.on('data', (chunk) => {
      
          body += chunk;
        });
        response.on('end', () => {
          const data = {
            statusCode,
            statusMessage,
            headers,
          };

         
          if (body) {
            data.body = JSON.parse(body);
          }
          resolve(data);
        });
      },
      (err) => {
     

        reject(err);
      },
    );
  });
}

module.exports = {
  sendRequest,
};
