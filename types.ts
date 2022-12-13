export interface SessionData {
  browser: BrowserSession[];
  apiKey: ApiKeySession[];
}

export interface BrowserSession {
  id: string;
  label: string;
  createdOn: string;
  createdAt: Date;
  resource: string;
  sessionId: string | null;
  current?: boolean;
}

export interface ApiKeySession {
  id: string;
  label: string;
  createdOn: string;
  createdAt: Date;
  resource: string;
  expires: Date;
}
