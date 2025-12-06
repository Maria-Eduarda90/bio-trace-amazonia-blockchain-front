import { 
  BatchesResponse, 
  HistoryEvent, 
  CertificateResponse, 
  MapResponse,
  DispatchPayload,
  ReceivePayload,
  InspectionPayload,
  FinalizePayload
} from '../types';

const BASE_URL = 'https://bio-trace-amazonia-blockchain.onrender.com';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`);
  }
  return response.json();
}

export const api = {
  // 1. List All Batches
  getBatches: async (page = 1, limit = 10): Promise<BatchesResponse> => {
    const res = await fetch(`${BASE_URL}/batches?page=${page}&limit=${limit}`);
    return handleResponse<BatchesResponse>(res);
  },

  // 2. Batch History
  getHistory: async (batchId: string): Promise<HistoryEvent[]> => {
    const res = await fetch(`${BASE_URL}/batches/${batchId}/history`);
    return handleResponse<HistoryEvent[]>(res);
  },

  // 3. Certificate
  getCertificate: async (batchId: string): Promise<CertificateResponse> => {
    const res = await fetch(`${BASE_URL}/batches/${batchId}/certificate`);
    return handleResponse<CertificateResponse>(res);
  },

  // 4. Map Route
  getMap: async (batchId: string): Promise<MapResponse> => {
    const res = await fetch(`${BASE_URL}/batches/${batchId}/map`);
    return handleResponse<MapResponse>(res);
  },

  // 5. Dispatch Event
  postDispatch: async (payload: DispatchPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/events/dispatched`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<void>(res);
  },

  // 6. Received Event
  postReceived: async (payload: ReceivePayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/events/received`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<void>(res);
  },

  // 7. Quality Inspection Event (Replaces Rating)
  postInspection: async (payload: InspectionPayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/events/inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<void>(res);
  },

  // 8. Finalize Event
  postFinalized: async (payload: FinalizePayload): Promise<void> => {
    const res = await fetch(`${BASE_URL}/events/finalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<void>(res);
  },
};
