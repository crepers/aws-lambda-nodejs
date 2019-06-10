'use strict';

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Create CloudWatch logs
var cloudwatchlogs = new AWS.CloudWatchLogs();

/**
 * Lambda function to send logs to S3.
 *
 * for test case
 * {
 *   "targetDate": "2018-03-16"
 * }
 */
exports.handler = (event, context, callback) => {
	let now = new Date();
	// log configutaions
	let logParams = {
	// 	logDays : -1,   // for automatically
		logHours : -9,
		logGroup : [
			{
			    destination: 'log-backup' 
				,destinationPrefix: 'PRD'
				,logGroupName: 'PRD'
			}
		]
	}
	
	// When user input the date to process.
	if(event.targetDate) {
		try {
			now = new Date(event.targetDate);
		} catch(err) {
			console.error(err);
			callback(new Error(err));
		}
	} else {
		if(logParams.logDays) {
			now.setDate(now.getDate() + parseInt((logParams.logDays),10));
		}
		now.setHours(0,0,0);
	}
	
	let to = new Date(now);
	to.setDate(to.getDate() + 1);
	if (logParams.logHours) to.setHours(to.getHours() + parseInt(logParams.logHours, 10));
	
	let from = new Date(now);
	if (logParams.logHours) from.setHours(from.getHours() + parseInt(logParams.logHours, 10));
	
	let month = '' + (now.getMonth() + 1), 
		day = '' + now.getDate(), 
		year = now.getFullYear(); 
	
	if (month.length < 2) month = '0' + month; 
	if (day.length < 2) day = '0' + day; 
	
	try {
		// Set the region 
		AWS.config.update({ region: 'ap-northeast-2' });

		for(let i in logParams.logGroup) {
			let logGroup = logParams.logGroup[i];
			let bucketName = logGroup.destinationPrefix + '/' + year + '/' + month  + '/' + day;
			
			// set up s3, logs
			let params = {
				destination: logGroup.destination
				,destinationPrefix: bucketName
				,logGroupName: logGroup.logGroupName
				,from : from.getTime()
				,to : to.getTime()
			};
				
			if(logGroup.logStreamNamePrefix) {
				if(typeof(logGroup.logStreamNamePrefix) === 'string') {
					params.logStreamNamePrefix = logGroup.logStreamNamePrefix;
					params.taskName = "LogTask_" + logGroup.logStreamNamePrefix + "_" + year + month + day;
					
					createExportTask(params, i);
				} else {
					for(let j in logGroup.logStreamNamePrefix) {
						params.logStreamNamePrefix = logGroup.logStreamNamePrefix[j];
						params.taskName = "LogTask_" + logGroup.logStreamNamePrefix[j] + "_" + year + month + day;
						
						createExportTask(params, i * j);
					}
				}
			} else {
				params.taskName = "LogTask_" + logGroup.destination + "_" + year + month + day;
				createExportTask(params, i);
			}
		}
	} catch(err) {
		console.error('General Error.');
		console.error(err);
	}
};

/**
 * Export logs to S3
 */
function createExportTask(params, index) {
	cloudwatchlogs.createExportTask(params, function(err, data) {
		if(err) {
			console.error('Error : ' + err, err.stack);
		} else if(data) {
			console.log('Completed...' + JSON.stringify(data));
		}
	});
}

/**
 * Sleep waiting function.
 */
function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}