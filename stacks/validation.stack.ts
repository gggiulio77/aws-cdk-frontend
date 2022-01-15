import { App, StackProps, Stack } from '@aws-cdk/core';

import {
    Certificate,
    DnsValidatedCertificate,
    ICertificate,
} from '@aws-cdk/aws-certificatemanager';
import { HostedZone, IHostedZone } from '@aws-cdk/aws-route53';

export interface ValidationStackProps extends StackProps {
    projectName: string;
    hostedZoneDomain: string;
    certificateArnString: string;
}

export class ValidationStack extends Stack {
    public hostedZone: IHostedZone;
    public certificate: ICertificate;
    public certificateArn: string;

    constructor(app: App, id: string, props: ValidationStackProps) {
        super(app, id, props);

        // Validate Resources: Certificate (CloudFront or APL), HostedZone and APL
        this.hostedZone = HostedZone.fromLookup(this, 'Zone', { domainName: props.hostedZoneDomain });
        if (!props.certificateArnString) {
            // Request Certificate Cross Region (intended for CloudFront)
            this.certificate = new DnsValidatedCertificate(this, `${props.projectName}-Certificate`, {
                domainName: props.hostedZoneDomain,
                subjectAlternativeNames: [`*.${props.hostedZoneDomain}`],
                hostedZone: this.hostedZone,
                region: 'us-east-1', // Cloudfront only checks this region for certificates.
            });
        } else {
            if (props.certificateArnString.split(':')[3] !== 'us-east-1') {
                throw new Error('HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN must be located on us-east-1 for CloudFront');
            }
            if (props.certificateArnString.split(':')[4] !== props.env?.account) {
                throw new Error('HOSTED_ZONE_DOMAIN_CERTIFICATE_ARN is located in another account');
            }
            this.certificate = Certificate.fromCertificateArn(this, `${props.projectName}-Certificate`, props.certificateArnString);
        }
    }
}
