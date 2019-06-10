// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
const BATCH_RESULT = process.env.BATCH_RESULT_PATH;

const athena = new AWS.Athena({
	version: '2017-05-18',
	region: 'ap-northeast-2',
});

async function createPartition(tableName, s3Path) {
	const now = new Date().toISOString();
	let date = now.split('T')[0].split('-');
	let year = date[0];
	let month = date[1];
	let day = date[2];
	let hour = now.split('T')[1].split(':')[0];

	const  QueryExecutionId  = await runQuery({
		QueryString: `ALTER TABLE ${tableName}
		ADD IF NOT EXISTS PARTITION (year='${year}',month='${month}',day='${day}', hour='${hour}')
		location 's3://${s3Path}/${year}/${month}/${day}/${hour}'`,
		UniqueRequestId: `automatic-firehose-partitioning-add-${year}-${month}-${day}-${hour}`,
	});

    console.log('QueryExecutionId = ' + JSON.stringify(QueryExecutionId));

	return queryExecute(QueryExecutionId);
}

async function dropPartition(tableName) {
	let targetDate = new Date();
	targetDate = targetDate.setDate(targetDate.getDate()-31);

	const now = new Date(targetDate).toISOString();
	
	let date = now.split('T')[0].split('-');
	let year = date[0];
	let month = date[1];
	let day = date[2];
	let hour = now.split('T')[1].split(':')[0];

	const  QueryExecutionId  = await runQuery({
		QueryString: `ALTER TABLE ${tableName}
		DROP IF EXISTS PARTITION (year='${year}',month='${month}',day='${day}', hour='${hour}')`,
		UniqueRequestId: `automatic-firehose-partitioning-drop-${year}-${month}-${day}-${hour}`,
	});

	return queryExecute(QueryExecutionId);
}

async function queryExecute(QueryExecutionId) {
	for (let attempt = 0; attempt < 10; attempt++) {
		const result = await getQueryExecution(QueryExecutionId);
		const state = result.QueryExecution.Status.State;
		switch (state) {
			case 'RUNNING':
			case 'QUEUED':
				console.log(
					'query is queued or running, retrying in ',
					Math.pow(2, attempt + 1) * 100,
					'ms',
				);
				await delay(Math.pow(2, attempt + 1) * 100);
				break;
			case 'SUCCEEDED':
				return true;
			case 'FAILED':
				console.log('query failed');
				throw new Error(result.QueryExecution.Status.StateChangeReason);
			case 'CANCELLED':
				console.log('query is cancelled');
				return;
		}
	}
}

async function runQuery({ QueryString, UniqueRequestId }) {
	console.log('running query', QueryString);
	const params = {
		QueryString,
		ResultConfiguration: {
			OutputLocation: 's3://' + BATCH_RESULT,
		},
		ClientRequestToken: UniqueRequestId,
	};
	return await athena.startQueryExecution(params).promise();
}

async function getQueryExecution(QueryExecutionId) {
// 	const params = {
// 		QueryExecutionId,
// 	};
	const params = 	QueryExecutionId;

	return await athena.getQueryExecution(params).promise();
}

async function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

exports.createPartition = createPartition;
exports.dropPartition = dropPartition;