#!/usr/bin/env node
import "source-map-support/register";
import { App } from "@aws-cdk/core";
import { InfraStack } from "../lib/infra-stack";

const app = new App();
new InfraStack(app, "InfraStack", {
  googleClientId: process.env.GOOGLE_CLIENT_ID!,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET!,
});
