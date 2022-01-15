import { cleanEnv, str, host, makeValidator } from 'envalid';
import { config } from 'dotenv';

config({ path: '../../.env' });
const NotWhiteSpaceAndNotEmptyString = new RegExp('^$|\\s+');
const NoEmpty = new RegExp('^\\s*$');

const stringEmptyValidation = makeValidator((env) => {
    if (NoEmpty.test(env)) {
        throw new Error('String contains is empty');
    }
    return env;
});

const stringEmptyWhiteSpaceValidation = makeValidator((env) => {
    if (NotWhiteSpaceAndNotEmptyString.test(env)) {
        throw new Error('String contains a whitespace or is empty');
    }
    return env;
});

export const ENV = cleanEnv(process.env, {
    CDK_DEFAULT_ACCOUNT: stringEmptyWhiteSpaceValidation(),
    CDK_DEFAULT_REGION: str({ choices: ['us-east-1', 'us-east-2', 'sa-east-1'] }),
    PROJECT_NAME: stringEmptyWhiteSpaceValidation(),
    STAGE_NAME: str({ choices: ['PRODUCTION', 'Production', 'DEVELOPMENT', 'Development', 'STAGING', 'Staging', 'DEMO', 'Demo', 'TEST', 'test'] }),
    HOSTED_ZONE_DOMAIN: host(),
    HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN: str(),
    FRONTEND_GITHUB_REPO_BRANCH: stringEmptyWhiteSpaceValidation(),
    FRONTEND_GITHUB_OWNER: stringEmptyWhiteSpaceValidation(),
    FRONTEND_GITHUB_OAUTHTOKEN: stringEmptyWhiteSpaceValidation(),
    FRONTEND_GITHUB_REPO: stringEmptyWhiteSpaceValidation(),
    FRONTEND_BUILD_COMMAND: stringEmptyValidation(),
    WEBAPP_DOMAIN: host(),
});
