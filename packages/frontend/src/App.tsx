import React from "react";
import "./App.css";
import { API, Auth, graphqlOperation, Hub } from "aws-amplify";
import { CognitoHostedUIIdentityProvider } from "@aws-amplify/auth";
import * as queries from "../src/graphql/queries";
import * as mutations from "../src/graphql/mutations";
import { CognitoUserInterface } from "@aws-amplify/ui-components";

export interface User extends CognitoUserInterface {
  attributes: {
    email: string;
    nickname: string;
    picture: string;
  };
}

async function checkUser() {
  const user = await Auth.currentAuthenticatedUser().catch((err) => err);
  if (user instanceof Error) {
    console.log("user is not login");
  } else {
    console.log("user: ", user);
  }

  const userInfo = await Auth.currentUserInfo();
  console.log("userinfo: ", userInfo);

  const creds = await Auth.currentCredentials();
  console.log("creds: ", creds);
}

async function query() {
  const list = await API.graphql(graphqlOperation(queries.listMessages));
  console.log(list);
}

async function mutation() {
  const result = await API.graphql(
    graphqlOperation(mutations.addMessage, {
      input: {
        message: "メッセージ",
      },
    })
  );
  console.log(result);
}

export const App: React.FC = () => {
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    Hub.listen("auth", ({ payload: { event, data } }) => {
      switch (event) {
        case "signIn":
        case "cognitoHostedUI":
          getUser().then((userData) => setUser(userData));
          break;
        case "signOut":
          setUser(null);
          break;
        case "signIn_failure":
        case "cognitoHostedUI_failure":
          console.log("Sign in failure", data);
          break;
      }
    });

    getUser().then((userData) => setUser(userData));
  }, []);

  function getUser() {
    return Auth.currentAuthenticatedUser()
      .then((userData) => userData)
      .catch(() => console.log("Not signed in"));
  }

  if (user == null) {
    return (
      <>
        <p>User: None</p>
        <button onClick={checkUser}>Check User</button>
        <button onClick={query}>Get Query</button>
        <button onClick={mutation}>Set Mutation(don't work)</button>
        <br />
        <button
          onClick={() => {
            Auth.federatedSignIn();
          }}
        >
          Sign in
        </button>
        <button
          onClick={() => {
            Auth.federatedSignIn({
              provider: CognitoHostedUIIdentityProvider.Google,
            });
          }}
        >
          Sign in with Google
        </button>
      </>
    );
  } else {
    return (
      <>
        <p>nickname: {user.attributes.nickname}</p>
        <button onClick={checkUser}>Check User</button>
        <button onClick={query}>Get Query</button>
        <button onClick={mutation}>Set Mutation</button>
        <br />
        <button
          onClick={() => {
            Auth.signOut();
          }}
        >
          Sign out
        </button>
      </>
    );
  }
};
