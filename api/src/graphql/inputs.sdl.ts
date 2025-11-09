import { gql } from 'graphql-tag'

export const schema = gql`
  input ExtractEventInput {
    text: String!
    source: String!
    sourceMeta: JSON
  }

  input CreateEventInput {
    title: String!
    description: String
    start: DateTime!
    end: DateTime
    timezone: String!
    location: String
    attendees: [String!]
    reminders: [Int!]
  }

  input UpdateEventInput {
    title: String
    description: String
    start: DateTime
    end: DateTime
    location: String
    attendees: [String!]
    reminders: [Int!]
  }

  input UpdateSettingsInput {
    timezone: String
    defaultReminder: Int
    autoApprove: Boolean
    confidenceMin: Float
  }
`
