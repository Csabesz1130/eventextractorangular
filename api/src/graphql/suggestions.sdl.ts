import { gql } from 'graphql-tag'

export const schema = gql`
  type EventSuggestion {
    id: ID!
    userId: String!
    title: String!
    description: String
    start: DateTime
    end: DateTime
    timezone: String!
    location: String
    attendees: [String!]!
    reminders: [Int!]!
    confidence: Float!
    rawText: String!
    source: String!
    sourceMeta: JSON
    status: SuggestionStatus!
    approvedAt: DateTime
    snoozedUntil: DateTime
    eventId: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  enum SuggestionStatus {
    PENDING
    APPROVED
    REJECTED
    SNOOZED
  }

  type Query {
    suggestions(status: SuggestionStatus, limit: Int): [EventSuggestion!]! @requireAuth
    suggestion(id: ID!): EventSuggestion @requireAuth
  }

  type Mutation {
    extractEvent(input: ExtractEventInput!): EventSuggestion! @requireAuth
    approveSuggestion(id: ID!): Event! @requireAuth
    rejectSuggestion(id: ID!): EventSuggestion! @requireAuth
    snoozeSuggestion(id: ID!, until: DateTime!): EventSuggestion! @requireAuth
  }
`

