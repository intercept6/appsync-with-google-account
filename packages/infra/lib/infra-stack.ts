import { CfnOutput, Construct, Stack, StackProps } from "@aws-cdk/core";
import { CognitoUserPool } from "./cognito-user-pool";
import { CognitoIdp } from "./cognito-idp";
import { AttributeType, Table } from "@aws-cdk/aws-dynamodb";
import { AppSync } from "./app-sync";

export interface InfraStackProps extends StackProps {
  googleClientId: string;
  googleClientSecret: string;
}

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const domainPrefix = "appsync-with-google";

    const table = new Table(this, "table", {
      partitionKey: {
        type: AttributeType.STRING,
        name: "id",
      },
    });

    const { userPool, userPoolClient } = new CognitoUserPool(
      this,
      "user-pool",
      {
        googleClientId: props.googleClientId,
        googleClientSecret: props.googleClientSecret,
        domainPrefix,
      }
    );

    const { graphqlApi, graphqlUrl } = new AppSync(this, "app-sync", { table });

    const { idp } = new CognitoIdp(this, "idp", {
      userPool,
      userPoolClient,
      graphqlApi,
    });

    new CfnOutput(this, "graphql-endpoint", { value: graphqlUrl });
    new CfnOutput(this, "user-pool-id", { value: userPool.userPoolId });
    new CfnOutput(this, "user-pool-client-id", {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "identity-pool-id", { value: idp.ref });
    new CfnOutput(this, "region", { value: this.region });
    new CfnOutput(this, "domain", {
      value: `${domainPrefix}.auth.${this.region}.amazoncognito.com`,
    });
  }
}
