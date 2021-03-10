import { Construct } from "@aws-cdk/core";
import {
  AuthorizationType,
  FieldLogLevel,
  GraphqlApi,
  IGraphqlApi,
  MappingTemplate,
  PrimaryKey,
  Schema,
  Values,
} from "@aws-cdk/aws-appsync";
import { resolve } from "path";
import { ITable } from "@aws-cdk/aws-dynamodb";

export interface AppSyncProps {
  table: ITable;
}

export class AppSync extends Construct {
  public readonly graphqlApi: IGraphqlApi;
  public readonly graphqlUrl: string;

  constructor(scope: Construct, id: string, props: AppSyncProps) {
    super(scope, id);

    const graphqlApi = new GraphqlApi(this, "graphql", {
      name: "graphql",
      logConfig: {
        excludeVerboseContent: true,
        fieldLogLevel: FieldLogLevel.ALL,
      },
      schema: Schema.fromAsset(resolve("../../schema.graphql")),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
    });

    const dynamoDbDataSource = graphqlApi.addDynamoDbDataSource(
      "DdbDataSource",
      props.table
    );
    dynamoDbDataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addMessage",
      requestMappingTemplate: MappingTemplate.dynamoDbPutItem(
        PrimaryKey.partition("id").auto(),
        Values.projecting("input")
      ),
      responseMappingTemplate: MappingTemplate.dynamoDbResultItem(),
    });
    dynamoDbDataSource.createResolver({
      typeName: "Query",
      fieldName: "listMessages",
      requestMappingTemplate: MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: MappingTemplate.dynamoDbResultList(),
    });

    this.graphqlApi = graphqlApi;
    // IGraphApi doesn't have graphqlUrl method😭
    this.graphqlUrl = graphqlApi.graphqlUrl;
  }
}
