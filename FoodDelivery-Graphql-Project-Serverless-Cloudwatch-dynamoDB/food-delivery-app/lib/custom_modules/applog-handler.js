const AWS = require('aws-sdk');

const region = 'us-east-1';
const env = 'dev';

const logStreamPrefix = 'fda_applog';
const loggrpName = 'fda_applicationlogs';

const cloudWatchLogs = new AWS.CloudWatchLogs({
  region,
});

function getlogStreamName(userId, appName) {
  const currDate = new Date().toISOString().slice(0, 10);

  return `${logStreamPrefix}_${appName}_${userId}_${currDate}-${env}`;
}

function getlogGroupName() {
  return `${loggrpName}-${env}`;
}

function _createLogStream(logGroupName, logStreamName) {
  return cloudWatchLogs
    .createLogStream({
      logGroupName,
      logStreamName,
    })
    .promise();
}

function _describeLogStream(logGroupName, logStreamName) {
  return cloudWatchLogs
    .describeLogStreams({
      logGroupName,
      descending: false,
      limit: 1,
      logStreamNamePrefix: logStreamName,
    })
    .promise();
}

function _writeLogs(logGroupName, logEventsBuffer, logStreamName, logStreamSequence) {
  const cloudWatchParams = {
    logEvents: logEventsBuffer,
    logGroupName,
    logStreamName,

  };

  if (logStreamSequence) {
    cloudWatchParams.sequenceToken = logStreamSequence;
  }

  return cloudWatchLogs.putLogEvents(cloudWatchParams).promise();
}

async function writeToCloudWatch(appName, userId, LogItem) {
  let logStreamName = getlogStreamName(userId, appName);
  const logGroupName = getlogGroupName();
  let dataLogStream;
  let logStreamSequence;

  const logEventsBuffer = [];

  logEventsBuffer.push({
    message: JSON.stringify(LogItem),
    timestamp: new Date().getTime(),
  });

  try {
    dataLogStream = await _describeLogStream(logGroupName, logStreamName);
    if (dataLogStream.logStreams.length > 0) {
      logStreamName = dataLogStream.logStreams[0].logStreamName;
      logStreamSequence = dataLogStream.logStreams[0].uploadSequenceToken;
    } else {
      dataLogStream = await _createLogStream(logGroupName, logStreamName);

      if (dataLogStream.nextSequenceToken) {
        logStreamSequence = dataLogStream.nextSequenceToken;
      }
    }
  } catch (err) {
    return err;
  }

  let nextSeq;
  try {
    const res = await _writeLogs(logGroupName, logEventsBuffer, logStreamName, logStreamSequence);
  } catch (err) {
    const seqMsg = err.message;

    if (err.code === 'InvalidSequenceTokenException') {
      nextSeq = seqMsg.split(' ', 11).pop();
    }
  }

  if (nextSeq) {
    logStreamSequence = nextSeq;

    try {
      const res = await _writeLogs(logGroupName, logEventsBuffer, logStreamName, logStreamSequence);
    } catch (err) {
      return err;
    }
  }

  return Promise.resolve();
}

module.exports = {
  writeToCloudWatch,
};
