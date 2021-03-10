/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Message = {
  message: string,
};

export type MessageTemplate = {
  __typename: "MessageTemplate",
  id?: string,
  message?: string,
};

export type AddMessageMutationVariables = {
  input?: Message | null,
};

export type AddMessageMutation = {
  addMessage:  {
    __typename: "MessageTemplate",
    id: string,
    message: string,
  },
};

export type ListMessagesQuery = {
  listMessages:  Array< {
    __typename: "MessageTemplate",
    id: string,
    message: string,
  } | null >,
};
