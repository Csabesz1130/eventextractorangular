import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable, map } from 'rxjs';

const GET_GOOGLE_AUTH_URL = gql`
  query GetGoogleAuthUrl {
    getGoogleAuthUrl
  }
`;

const CONNECT_GMAIL = gql`
  mutation ConnectGmail($code: String!) {
    connectGmail(code: $code) {
      id
      provider
      email
      enabled
      lastPolled
    }
  }
`;

const GET_CONNECTORS = gql`
  query GetConnectors {
    connectors {
      id
      provider
      email
      enabled
      lastPolled
      createdAt
    }
  }
`;

const DISCONNECT_CONNECTOR = gql`
  mutation DisconnectConnector($id: ID!) {
    disconnectConnector(id: $id)
  }
`;

const POLL_CONNECTOR = gql`
  mutation PollConnector($id: ID!) {
    pollConnector(id: $id) {
      id
      title
      start
      end
      confidence
      source
    }
  }
`;

@Injectable({ providedIn: 'root' })
export class ConnectorsService {
  constructor(private apollo: Apollo) {}

  getGoogleAuthUrl(): Observable<string> {
    return this.apollo
      .query<{ getGoogleAuthUrl: string }>({
        query: GET_GOOGLE_AUTH_URL,
      })
      .pipe(map((result) => result.data.getGoogleAuthUrl));
  }

  connectGmail(code: string): Observable<any> {
    return this.apollo.mutate({
      mutation: CONNECT_GMAIL,
      variables: { code },
    });
  }

  getConnectors(): Observable<any[]> {
    return this.apollo
      .query<{ connectors: any[] }>({
        query: GET_CONNECTORS,
        fetchPolicy: 'network-only',
      })
      .pipe(map((result) => result.data.connectors));
  }

  disconnectConnector(id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: DISCONNECT_CONNECTOR,
      variables: { id },
    });
  }

  pollConnector(id: string): Observable<any[]> {
    return this.apollo
      .mutate<{ pollConnector: any[] }>({
        mutation: POLL_CONNECTOR,
        variables: { id },
      })
      .pipe(map((result: any) => result.data?.pollConnector || []));
  }

  // Legacy methods for backward compatibility
  googleStart(userId: string): Observable<{ auth_url: string }> {
    return this.getGoogleAuthUrl().pipe(
      map((url) => ({ auth_url: url }))
    );
  }

  gmailPollOnce(): Observable<any> {
    // Get first Gmail connector and poll it
    return this.getConnectors().pipe(
      map((connectors) => {
        const gmailConnector = connectors.find(
          (c) => c.provider === 'GMAIL' && c.enabled
        );
        if (gmailConnector) {
          return this.pollConnector(gmailConnector.id);
        }
        throw new Error('No Gmail connector found');
      })
    );
  }
}
