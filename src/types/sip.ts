export interface SIPAccount {
  id: string;
  name: string;
  server: string; // SIP server address (e.g., sip.provider.com)
  userId: string; // SIP user ID
  password: string;
  port: number; // SIP server port (usually 5060 for UDP/TCP, 5061 for TLS)
  transport: "WS" | "WSS";
  websocketPath?: string; // WebSocket path (default: /ws for Asterisk)
  displayName?: string;
  isActive: boolean;
  registrationStatus: "registered" | "unregistered" | "connecting" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

export interface SIPAccountFormData {
  name: string;
  server: string;
  userId: string;
  password: string;
  port: number;
  transport: "WS" | "WSS";
  websocketPath?: string;
  displayName?: string;
}

export type TransportOption = {
  value: "WS" | "WSS";
  label: string;
};

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { value: "WS", label: "WebSocket" },
  { value: "WSS", label: "WebSocket Secure (WSS)" },
];

export const DEFAULT_PORTS: Record<string, number> = {
  WS: 8088,
  WSS: 8089,
};
