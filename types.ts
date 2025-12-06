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
  // New Fields
  notes?: string;
  dispatchedBy?: string;
  receivedBy?: string;
  finalizedBy?: string;
  inspector?: string;
}

export type EventType = 
  | 'BATCH_CREATED' 
  | 'IOT_UPDATE' 
  | 'DISPATCHED' 
  | 'RECEIVED' 
  | 'RATING' 
  | 'INSPECTION' 
  | 'FINALIZED';

export interface HistoryEvent {
  eventType: EventType;
  eventData: HistoryEventData;
  timestamp: string;
}

// Certificate Types
export interface CertificateResponse {
  batchId: string;
  gi: number;
  certificate: string;
  events?: HistoryEvent[];
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
  dispatchedBy: string;
  location: string;
  notes: string;
  lat: number;
  lng: number;
}

export interface ReceivePayload {
  batchId: string;
  receivedBy: string;
  location: string;
  notes: string;
  lat: number;
  lng: number;
}

export interface FinalizePayload {
  batchId: string;
  finalizedBy: string;
  location: string;
  notes: string;
  lat: number;
  lng: number;
}

export interface InspectionPayload {
  batchId: string;
  rating: number;
  inspector: string;
  notes: string;
  location: string;
  lat: number;
  lng: number;
}
