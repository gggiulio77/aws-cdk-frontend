# aws-cdk-frontend

Welcome to the AWS CDK Frontend project! Our goal is to provide a robust solution for deploying a complete frontend ecosystem using AWS CDK along with customizable environment variables.

### Quick Links

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [License](#license)

## Getting Started

The aim is to deploy all necessary Webapp resources with CI/CD. This includes:
* S3 bucket
* Cloudfront
* IAM
* ACM
* Route 53
* CodePipeline
* CodeBuild
* GitHub webhook
* Lambda to crate cloudfront invalidations

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/en), [AWS CLI](https://aws.amazon.com/es/cli/), and [AWS CDK CLI](https://docs.aws.amazon.com/cdk/v2/guide/cli.html) installed. It's recommended to follow AWS CLI recommendations for storing credentials in your system [link](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html).

### Installation

`git clone https://github.com/gggiulio77/aws-cdk-frontend.git`

## Usage

Commands:
 * `npm run bootstrap:frontEnd -- PROFILE_NAME`: necessary for `cdk deploy` to work, creates an S3 bucket with assets
 * `npm run synth:frontEnd -- PROFILE_NAME`: generates the synthesized CloudFormation template
 * `npm run deploy:frontEnd -- PROFILE_NAME`: deploys multiple stacks from the frontEnd application

The `cdk.json` file configures the CDK Toolkit execution.

### Important Notes
* Use the `--profile` flag or `PROFILE_NAME` to set values for `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`, overriding previous .env values.
* The GitHub webhook requires an OAuth token with admin access to the repository (store in `FRONTEND_GITHUB_OAUTHTOKEN` env variable).
* The frontend application requires an AWS hosted zone stored in `HOSTED_ZONE_DOMAIN` env variable.
* `HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN` is the TLS certificate for `*.HOSTED_ZONE_DOMAIN` requested in ACM (AWS Certificate Manager), necessary for the WebApp Stack and Application Load Balancer. The certificate's region must match `CDK_DEFAULT_REGION` or the `--profile` flag. If empty, CDK will issue the certificate (and use it in Cloudfront).
* When building with CodeBuild in CodePipeline, the `FRONTEND_BUILD_COMMAND` is utilized in the buildspec.yml.
* Remember to delete all files inside the S3 bucket before running `cdk destroy`.

### Cdk native commands

* `cdk deploy`: deploy this stack to your default AWS account/region.
* `cdk diff`: compare deployed stack with current state.
* `cdk synth`: generates the synthesized CloudFormation template.
* `cdk bootstrap --profile=PROFILE_NAME`needed for cdk deploy to work, creates an S3 bucket with assets.
* `cdk destroy stack1 stack2 ... --profile=PROFILE_NAME`: deletes created resources (except CloudFormation resources and S3 bucket from bootstrap).
* `cdk deploy stack1 stack2 ... --profile=PROFILE_NAME`: deploys multiple stacks from an app.
* `cdk deploy --all --profile=PROFILE_NAME`: deploys all stacks from an app.

## Roadmap

- [ ] Improve documentation
- [ ] Update all dependencies
- [ ] Refactor all deprecated functions or methods
- [ ] Develop a similar project using the new [AWS Copilot](https://github.com/aws/copilot-cli) tool