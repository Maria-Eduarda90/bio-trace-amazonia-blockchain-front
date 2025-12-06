// Batch List Types
export interface BatchSummary {
  batchId: string;
  firstEvent: string;
  lastEvent: string;
  eventCount: number;
  gi: number;
  certificate: string;
}

export interface BatchesResponse {
  page: number;
  limit: number;
  batches: BatchSummary[];
}

// History Types
export interface HistoryEventData {
  temperature?: number;
  humidity?: number;
  lat?: number;
  lng?: number;
  location?: string;
  rating?: number;
}

export interface HistoryEvent {
  eventType: 'BATCH_CREATED' | 'IOT_UPDATE' | 'DISPATCHED' | 'RECEIVED' | 'RATING';
  eventData: HistoryEventData;
  timestamp: string;
}

// Certificate Types
export interface CertificateResponse {
  batchId: string;
  gi: number;
  certificate: string;
  events?: HistoryEvent[]; // Optional based on example provided in prompt
}

// Map Types
export interface MapCoordinate {
  type: string;
  lat: number;
  lng: number;
  timestamp: string;
}

export interface MapResponse {
  batchId: string;
  count: number;
  coordinates: MapCoordinate[];
}

// Action Payloads
export interface DispatchPayload {
  batchId: string;
  location: string;
  lat: number;
  lng: number;
}

export interface ReceivePayload {
  batchId: string;
  location: string;
  lat: number;
  lng: number;
}

export interface RatingPayload {
  batchId: string;
  rating: number;
  lat: number;
  lng: number;
}
