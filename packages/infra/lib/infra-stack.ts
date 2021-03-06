import { Construct, Stack, StackProps } from "@aws-cdk/core";
import { CognitoUserPool } from "./cognito-user-pool";
import { CognitoIdp } from "./cognito-idp";

export interface InfraStackProps extends StackProps {
  clientId: string;
  clientSecret: string;
}

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const { userPool, userPoolClient } = new CognitoUserPool(
      this,
      "user-pool",
      {
        clientId: props.clientId,
        clientSecret: props.clientSecret,
      }
    );

    new CognitoIdp(this, "idp", {
      userPool,
      userPoolClient,
    });
  }
}
