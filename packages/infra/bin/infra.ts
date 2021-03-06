#!/usr/bin/env node
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import { InfraStack } from "../lib/infra-stack";

const app = new App();
new InfraStack(app, "InfraStack", {
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});
