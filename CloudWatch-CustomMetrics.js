// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the AWS Credentials
var credentials = new AWS.SharedIniFileCredentials({profile: 'wcjung'});
AWS.config.credentials = credentials;

// Set the region 
AWS.config.update({region: 'ap-northeast-2'});

// Create CloudWatch service object
var cw = new AWS.CloudWatch({apiVersion: '2010-08-01'});

// Create parameters JSON for putMetricData
var params = {
  MetricData: [
    {
      MetricName: 'Application(DEV)',
      Dimensions: [
        {
          Name: 'Hit',
          Value: 'Hit count'
        }
      ],
      Timestamp: new Date(),
      Unit: 'Count',
      Value: 1.0
    },
  ],
  Namespace: 'Your Namespace'
};

cw.putMetricData(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", JSON.stringify(data));
  }
});