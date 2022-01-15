import { Distribution } from '@aws-cdk/aws-cloudfront';
import { S3Origin } from '@aws-cdk/aws-cloudfront-origins';
import { ARecord, IHostedZone, RecordTarget } from '@aws-cdk/aws-route53';
import { Bucket } from '@aws-cdk/aws-s3';
import { CfnOutput, RemovalPolicy, StackProps, Stack, App } from '@aws-cdk/core';
import { CloudFrontTarget } from '@aws-cdk/aws-route53-targets/lib';

import { ICertificate } from '@aws-cdk/aws-certificatemanager';
/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */

export interface WebStackProps extends StackProps {
    hostedZone: IHostedZone;
    webAppDomain: string;
    projectName: string;
    stageName: string;
    certificate: ICertificate;
}

export class WebStack extends Stack {
    public siteBucket: Bucket;
    public cloudfrontWebApp: Distribution;

    constructor(app: App, id: string, props: WebStackProps) {
        super(app, id, props);

        const zone = props.hostedZone;
        new CfnOutput(this, 'Site', { value: `https://${props.webAppDomain}` });

        // Content bucket
        const siteBucket = new Bucket(this, `${props.projectName}-${props.stageName}-Bucket`, {
            bucketName: props.webAppDomain,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,

            // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
            // the new bucket, and it will remain in your account until manually deleted. By setting the policy to
            // DESTROY, cdk destroy will attempt to delete the bucket, but will error if the bucket is not empty.
            removalPolicy: RemovalPolicy.DESTROY, // NOT recommended for production code
            autoDeleteObjects: true,
        });
        // Save bucket value in the APP scope, i need this because i use this bucket in the CodePipeline Stack
        this.siteBucket = siteBucket;
        // Print bucket name
        new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName });

        // Arn from *.xxxx.com arn:aws:acm:us-east-1:xxxxxxxxxxxxxxxxxx:certificate/xxxxxxxxxxxxx-xxxxxx-xxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxx
        // User *.xxxx.com certificate, the sub domain cannot include a '.'
        // For example: xxxxx-xxxxx.xxxx.com is okey but xxxxx.xxxxx.xxxxx.com will not work

        // CloudFront distribution that provides HTTPS
        const distribution = new Distribution(this, `${props.projectName}-${props.stageName}-CFDistribution`, {
            defaultBehavior: { origin: new S3Origin(siteBucket) },
            domainNames: [props.webAppDomain],
            certificate: props.certificate,
        });

        // Save the CF in de app scope because i will use it in the Code Pipeline at the Post Deploy Stage
        this.cloudfrontWebApp = distribution;

        new CfnOutput(this, 'DistributionId', { value: distribution.distributionId });

        // Route53 alias record for the CloudFront distribution
        new ARecord(this, `${props.projectName}-${props.stageName}-AliasRecord`, {
            recordName: props.webAppDomain,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
            zone,
        });
    }
}
