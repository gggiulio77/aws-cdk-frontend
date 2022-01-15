import { PipelineProject, BuildSpec, LinuxBuildImage, BuildEnvironmentVariableType } from '@aws-cdk/aws-codebuild';
import { Pipeline, Artifact } from '@aws-cdk/aws-codepipeline';
import { CodeBuildAction, GitHubSourceAction, S3DeployAction, LambdaInvokeAction, GitHubTrigger } from '@aws-cdk/aws-codepipeline-actions';
import { App, SecretValue, StackProps, Stack, Duration } from '@aws-cdk/core';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { Function, Runtime, Code } from '@aws-cdk/aws-lambda';
import { Distribution } from '@aws-cdk/aws-cloudfront';
import { Bucket } from '@aws-cdk/aws-s3';

export interface WebCodePipelineStackProps extends StackProps {
    projectName: string;
    stageName: string;
    cloudfrontWebApp: Distribution;
    branch: string;
    owner: string;
    repo: string;
    buildCMD: string;
    oauthToken: string;
    deployBucket: Bucket;
}

export class WebCodePipelineStack extends Stack {
    constructor(app: App, id: string, props: WebCodePipelineStackProps) {
        super(app, id, props);

        // Create CodeBuild to build the WebApp
        const WebAppBuild = new PipelineProject(this, `${props.projectName}${props.stageName}CodeBuild`, {
            buildSpec: BuildSpec.fromSourceFilename('buildspec.yml'),
            environment: {
                buildImage: LinuxBuildImage.AMAZON_LINUX_2_3,
            },
        });
        // Create CodePipeline Artifacts
        const WebAppBuildOutput = new Artifact(`${props.projectName}-${props.stageName}-BuildOutput`);

        // #Option 2: Lambda function create a CF invalidation
        // Create Lambda function with ./resources/*.js function handler
        const lambdaFunc = new Function(this, `${props.projectName}-${props.stageName}-LambdaCF`, {
            runtime: Runtime.NODEJS_14_X,
            code: Code.fromAsset('../../resources'),
            handler: 'lambdaCF.handler',
            environment: {
                CLOUDFRONT_ID: props.cloudfrontWebApp.distributionId,
            },
            timeout: Duration.seconds(20),
            memorySize: 128,
            functionName: `${props.projectName}-${props.stageName}-LambdaCF`,
        });
        // Grant Lambda Function permission to create invalidation on Cloudfront
        const clodFrontPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            sid: 'AllowAllCloudFrontPermissions',
            actions: ['cloudfront:*'],
            resources: ['*'],
        });
        lambdaFunc.addToRolePolicy(clodFrontPolicy);

        // Create CodePipeline Artifacts
        const sourceOutput = new Artifact();

        // Create CodePipeline
        const pipeline = new Pipeline(this, `${props.projectName}-${props.stageName}-CodePipeline`, {
            pipelineName: `${props.projectName}-${props.stageName}-CodePipeline`,
            crossAccountKeys: false,
            stages: [
                {
                    stageName: 'Source',
                    actions: [
                        new GitHubSourceAction({
                            actionName: 'Github_Source',
                            branch: props.branch,
                            owner: props.owner,
                            oauthToken: SecretValue.plainText(props.oauthToken),
                            repo: props.repo,
                            trigger: GitHubTrigger.WEBHOOK,
                            output: sourceOutput,
                        }),
                    ],
                },
                {
                    stageName: 'Build',
                    actions: [
                        new CodeBuildAction({
                            actionName: `${props.projectName}_Build`,
                            project: WebAppBuild,
                            input: sourceOutput,
                            outputs: [WebAppBuildOutput],
                            environmentVariables: {
                                BUILD_CMD: {
                                    value: `${props.buildCMD}`,
                                    type: BuildEnvironmentVariableType.PLAINTEXT,
                                },
                            },
                        }),
                    ],
                },
                {
                    stageName: 'Deploy',
                    actions: [
                        new S3DeployAction({
                            actionName: 'S3_Deploy',
                            bucket: props.deployBucket,
                            input: WebAppBuildOutput,
                        }),
                    ],
                },
                {
                    stageName: 'Post-Deploy',
                    actions: [
                        new LambdaInvokeAction({
                            actionName: 'Lambda_CF_Invalidation',
                            lambda: lambdaFunc,
                        }),
                    ],
                },
            ],
        });
    }
}
