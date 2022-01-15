const aws = require('aws-sdk');
const cloudfront = new aws.CloudFront();
const codepipeline = new aws.CodePipeline();

const cloudFrontID = process.env.CLOUDFRONT_ID;

exports.handler = async (event, context) => {
    console.info(`Hello, Lambda is working. CF_ID = ${cloudFrontID}`);

    // Retrieve the Job ID from the Lambda action
    const jobId = event["CodePipeline.job"].id;

    const params = {
        DistributionId: cloudFrontID,
        InvalidationBatch: {
            CallerReference: `Called from CodePipeline Stage at: ${new Date().getTime()}`,
            Paths: {
                Quantity: 1,
                Items: ['/*'],
            },
        },
    };

    try {
        const invResult = await cloudfront.createInvalidation(params).promise();
        await putJobSuccess(jobId, `Invalidation Complete, location: ${invResult.Location}`);
    } catch (e) {
        await putJobFailure(jobId, e, context.awsRequestId);
    }
};

// Notify AWS CodePipeline of a success job
const putJobSuccess = async (jobId, message) => {
    await codepipeline.putJobSuccessResult({
        jobId: jobId,
    }).promise();
    return message;
};

// Notify AWS CodePipeline of a failed job
const putJobFailure = async (jobId, message, executionId) => {
    await codepipeline.putJobFailureResult({
        jobId: jobId,
        failureDetails: {
            message: JSON.stringify(message),
            type: 'JobFailed',
            externalExecutionId: executionId,
        },
    }).promise();
    return message;
};
