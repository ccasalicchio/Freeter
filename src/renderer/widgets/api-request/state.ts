export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HeaderPair {
  key: string;
  value: string;
}

export interface SavedRequest {
  id: number;
  name: string;
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
}

export interface ApiRequestState {
  savedRequests: SavedRequest[];
  nextRequestId: number;
  lastResponse: {
    status: number;
    statusText: string;
    headers: string;
    body: string;
  } | null;
}

export interface ActiveRequest {
  method: HttpMethod;
  url: string;
  headers: HeaderPair[];
  body: string;
}
