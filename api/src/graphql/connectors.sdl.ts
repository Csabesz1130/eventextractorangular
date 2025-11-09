import { gql } from 'graphql-tag'

export const schema = gql`
  type Connector {
    id: ID!
    userId: String!
    provider: ConnectorProvider!
    email: String
    phone: String
    enabled: Boolean!
    pollInterval: Int!
    lastPolled: DateTime
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum ConnectorProvider {
    GMAIL
    GOOGLE_CALENDAR
    OUTLOOK
    APPLE_CALENDAR
    TWILIO_SMS
  }

  type Query {
    connectors: [Connector!]! @requireAuth
    getGoogleAuthUrl: String! @requireAuth
  }

  type Mutation {
    connectGmail(code: String!): Connector! @requireAuth
    disconnectConnector(id: ID!): Boolean! @requireAuth
    pollConnector(id: ID!): [EventSuggestion!]! @requireAuth
  }
`

