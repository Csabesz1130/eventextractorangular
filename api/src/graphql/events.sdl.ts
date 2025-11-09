import { gql } from 'graphql-tag'

export const schema = gql`
  type Event {
    id: ID!
    userId: String!
    title: String!
    description: String
    start: DateTime!
    end: DateTime
    timezone: String!
    location: String
    attendees: [String!]!
    reminders: [Int!]!
    recurrence: String
    googleEventId: String
    outlookEventId: String
    appleEventId: String
    source: String
    rawText: String
    confidence: Float
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    events(start: DateTime, end: DateTime, limit: Int): [Event!]! @requireAuth
    event(id: ID!): Event @requireAuth
  }

  type Mutation {
    createEvent(input: CreateEventInput!): Event! @requireAuth
    updateEvent(id: ID!, input: UpdateEventInput!): Event! @requireAuth
    deleteEvent(id: ID!): Boolean! @requireAuth
  }
`

