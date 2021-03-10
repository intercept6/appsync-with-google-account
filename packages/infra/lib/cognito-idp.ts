import { Construct, Stack } from "@aws-cdk/core";
import {
  CfnIdentityPool,
  CfnIdentityPoolRoleAttachment,
  IUserPool,
  IUserPoolClient,
} from "@aws-cdk/aws-cognito";
import {
  Effect,
  WebIdentityPrincipal,
  PolicyDocument,
  PolicyStatement,
  Role,
} from "@aws-cdk/aws-iam";
import { IGraphqlApi } from "@aws-cdk/aws-appsync";

export interface CognitoIdpProps {
  userPool: IUserPool;
  userPoolClient: IUserPoolClient;
  authenticatedPolicyDocument?: PolicyDocument;
  unauthenticatedPolicyDocument?: PolicyDocument;
  graphqlApi: IGraphqlApi;
}

export class CognitoIdp extends Construct {
  public readonly idp: CfnIdentityPool;

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
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["appsync:GraphQL"],
            resources: [
              `arn:aws:appsync:${Stack.of(this).region}:${
                Stack.of(this).account
              }:apis/${props.graphqlApi.apiId}/types/Query/fields/*`,
              `arn:aws:appsync:${Stack.of(this).region}:${
                Stack.of(this).account
              }:apis/${props.graphqlApi.apiId}/types/Mutation/fields/*`,
            ],
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
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["appsync:GraphQL"],
            resources: [
              `arn:aws:appsync:${Stack.of(this).region}:${
                Stack.of(this).account
              }:apis/${props.graphqlApi.apiId}/types/Query/fields/*`,
            ],
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
      assumedBy: new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
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
      assumedBy: new WebIdentityPrincipal("cognito-identity.amazonaws.com", {
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
    });

    this.idp = idp;
  }
}
