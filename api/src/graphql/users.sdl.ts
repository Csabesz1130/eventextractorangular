import { gql } from 'graphql-tag'

export const schema = gql`
  type User {
    id: ID!
    email: String!
    name: String
    events: [Event!]!
    suggestions: [EventSuggestion!]!
    connectors: [Connector!]!
    settings: UserSettings
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserSettings {
    id: ID!
    timezone: String!
    defaultReminder: Int!
    autoApprove: Boolean!
    confidenceMin: Float!
  }

  type Query {
    me: User @requireAuth
  }

  type Mutation {
    updateSettings(input: UpdateSettingsInput!): UserSettings! @requireAuth
  }
`

