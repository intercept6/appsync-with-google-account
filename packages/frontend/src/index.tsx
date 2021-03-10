import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import { App } from "./App";
import reportWebVitals from "./reportWebVitals";
import Amplify from "aws-amplify";
import { InfraStack } from "./cdk/outputs.json";

Amplify.configure({
  aws_project_region: InfraStack.region,
  aws_appsync_graphqlEndpoint: InfraStack.graphqlendpoint,
  aws_appsync_region: InfraStack.region,
  aws_appsync_authenticationType: "AWS_IAM",
  aws_cognito_identity_pool_id: InfraStack.identitypoolid,
  aws_cognito_region: InfraStack.region,
  aws_user_pools_id: InfraStack.userpoolid,
  aws_user_pools_web_client_id: InfraStack.userpoolclientid,
  oauth: {
    domain: InfraStack.domain,
    scope: [
      "phone",
      "email",
      "openid",
      "profile",
      "aws.cognito.signin.user.admin",
    ],
    redirectSignIn: "http://localhost:3000/",
    redirectSignOut: "http://localhost:3000/",
    responseType: "code",
  },
  federationTarget: "COGNITO_USER_POOLS",
});

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
