
import { App } from '@aws-cdk/core';
import { WebStack } from '../../stacks/web.stack';
import { WebCodePipelineStack } from '../../stacks/webCodePipeline.stack';
import { ValidationStack } from '../../stacks/validation.stack';
import { ENV } from '../../util/env.validation';

const app = new App();

const ValidateApp = new ValidationStack(app, `Validation-${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}`, {
    projectName: ENV.PROJECT_NAME,
    hostedZoneDomain: ENV.HOSTED_ZONE_DOMAIN,
    certificateArnString: ENV.HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

const WebAppStack = new WebStack(app, `${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}`, {
    projectName: ENV.PROJECT_NAME,
    stageName: ENV.STAGE_NAME,
    hostedZone: ValidateApp.hostedZone,
    webAppDomain: ENV.WEBAPP_DOMAIN,
    certificate: ValidateApp.certificate,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

const WebAppCodePipelineStack = new WebCodePipelineStack(app, `${ENV.PROJECT_NAME}-${ENV.STAGE_NAME}-CodePipeline`, {
    stageName: ENV.STAGE_NAME,
    branch: ENV.FRONTEND_GITHUB_REPO_BRANCH,
    owner: ENV.FRONTEND_GITHUB_OWNER,
    oauthToken: ENV.FRONTEND_GITHUB_OAUTHTOKEN,
    repo: ENV.FRONTEND_GITHUB_REPO,
    deployBucket: WebAppStack.siteBucket,
    cloudfrontWebApp: WebAppStack.cloudfrontWebApp,
    projectName: ENV.PROJECT_NAME,
    buildCMD: ENV.FRONTEND_BUILD_COMMAND,
    env: {
        account: ENV.CDK_DEFAULT_ACCOUNT,
        region: ENV.CDK_DEFAULT_REGION,
    },
});

WebAppStack.addDependency(ValidateApp);
WebAppCodePipelineStack.addDependency(WebAppStack);
