import { Construct, RemovalPolicy } from "@aws-cdk/core";
import {
  IUserPool,
  IUserPoolClient,
  OAuthScope,
  ProviderAttribute,
  UserPool,
  UserPoolClientIdentityProvider,
  UserPoolIdentityProviderGoogle,
} from "@aws-cdk/aws-cognito";

export interface CognitoUserPoolProps {
  googleClientId: string;
  googleClientSecret: string;
  domainPrefix: string;
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
        domainPrefix: props.domainPrefix,
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
        clientId: props.googleClientId,
        clientSecret: props.googleClientSecret,
        scopes: ["openid", "email", "profile"],
        attributeMapping: {
          email: ProviderAttribute.GOOGLE_EMAIL,
          profilePicture: ProviderAttribute.GOOGLE_PICTURE,
          nickname: ProviderAttribute.GOOGLE_NAME,
        },
      }
    );
    if (googleIdp) {
      userPoolClient.node.addDependency(googleIdp);
    }

    this.userPool = userPool;
    this.userPoolClient = userPoolClient;
  }
}
