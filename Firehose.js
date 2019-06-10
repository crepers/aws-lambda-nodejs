var AWS = require('aws-sdk');
var firehose = new AWS.Firehose();

exports.handler = function(event, context) {
    console.log(decodeURIComponent(JSON.stringify(context)));
    
    let params = {
        DeliveryStreamName: 'deliveryStreamName',
        Record: {
            Data: JSON.stringify({
            	"T" : new Date(),
            	"Stage" : "PRD",
            	"Lambda" : "Reservation",
            	"ErrorMessage" : "errorMessage",
            	"Detail" : "err"
            })
        }
    };
    firehose.putRecord(params, function(err, data) {
        if (err) console.error(err, err.stack); // an error occurred
        else     console.log(data);           // successful response

        context.done();
    });
};
