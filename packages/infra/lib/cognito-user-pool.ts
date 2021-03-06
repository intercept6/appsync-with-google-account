import { Construct, RemovalPolicy } from "@aws-cdk/core";
import {
  IUserPool,
  IUserPoolClient,
  OAuthScope,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
} from "@aws-cdk/aws-cognito";

export interface CognitoUserPoolProps {
  clientId: string;
  clientSecret: string;
}

export class CognitoUserPool extends Construct {
  public readonly userPool: IUserPool;
  public readonly userPoolClient: IUserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoUserPoolProps) {
    super(scope, id);

    const userPool = new UserPool(this, "user-pool", {
      removalPolicy: RemovalPolicy.DESTROY,
    });
    userPool.addDomain("domain", {
      cognitoDomain: {
        domainPrefix: "appsync-with-google",
      },
    });
    const userPoolClient = userPool.addClient("client", {
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          OAuthScope.PHONE,
          OAuthScope.EMAIL,
          OAuthScope.COGNITO_ADMIN,
          OAuthScope.PROFILE,
        ],
        callbackUrls: ["http://localhost:3000/"],
        logoutUrls: ["http://localhost:3000/"],
      },
      supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
    });
    const googleIdp = new UserPoolIdentityProviderGoogle(
      this,
      "google-provider",
      {
        userPool,
        clientId: props.clientId,
        clientSecret: props.clientSecret,
        scopes: ["openid", "email", "profile"],
      }
    );
    if (googleIdp) {
      userPoolClient.node.addDependency(googleIdp);
    }

    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }
}
