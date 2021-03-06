import { Construct } from "@aws-cdk/core";
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  IUserPool,
  IUserPoolClient,
} from "@aws-cdk/aws-cognito";
import {
  Effect,
  FederatedPrincipal,
  PolicyDocument,
  PolicyStatement,
  Role,
} from "@aws-cdk/aws-iam";

export interface CognitoIdpProps {
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
  authenticatedPolicyDocument?: PolicyDocument;
  unauthenticatedPolicyDocument?: PolicyDocument;
}

export class CognitoIdp extends Construct {
  constructor(scope: Construct, id: string, props: CognitoIdpProps) {
    super(scope, id);

    const authenticatedPolicyDocument =
      props.authenticatedPolicyDocument ??
      new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["cognito-sync:*", "cognito-identity:*"],
            resources: ["*"],
          }),
        ],
      });

    const unauthenticatedPolicyDocument =
      props.unauthenticatedPolicyDocument ??
      new PolicyDocument({
        statements: [
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["cognito-sync:*"],
            resources: ["*"],
          }),
        ],
      });

    const idp = new CfnIdentityPool(this, "idp", {
      cognitoIdentityProviders: [
        {
          clientId: props.userPoolClient.userPoolClientId,
          providerName: `cognito-idp.ap-northeast-1.amazonaws.com/${props.userPool.userPoolId}`,
          serverSideTokenCheck: true,
        },
      ],
      allowUnauthenticatedIdentities: true,
    });

    const authenticated = new Role(this, "authenticated", {
      assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
        StringEquals: {
          "cognito-identity.amazonaws.com:aud": idp.ref,
        },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "authenticated",
        },
      }),
      inlinePolicies: { policy: authenticatedPolicyDocument },
    });
    const unauthenticated = new Role(this, "unauthenticated", {
      assumedBy: new FederatedPrincipal("cognito-identity.amazonaws.com", {
        StringEquals: { "cognito-identity.amazonaws.com:aud": idp.ref },
        "ForAnyValue:StringLike": {
          "cognito-identity.amazonaws.com:amr": "unauthenticated",
        },
      }),
      inlinePolicies: { policy: unauthenticatedPolicyDocument },
    });

    new CfnIdentityPoolRoleAttachment(this, "role-attachment", {
      identityPoolId: idp.ref,
      roles: {
        authenticated: authenticated.roleArn,
        unauthenticated: unauthenticated.roleArn,
      },
      // roleMappings: {
      //   mapping: {
      //     type: "Token",
      //     identityProvider:
      //       "cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-xxxxx:xxxx",
      //     ambiguousRoleResolution: "AuthenticatedRole",
      //   },
      // },
    });
  }
}
