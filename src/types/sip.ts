export interface SIPAccount {
  id: string;
  name: string;
  server: string; // SIP server address (e.g., sip.provider.com)
  userId: string; // SIP user ID
  password: string;
  port: number; // SIP server port (usually 5060 for UDP/TCP, 5061 for TLS)
  transport: "UDP" | "TCP" | "TLS" | "WS" | "WSS";
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
  transport: "UDP" | "TCP" | "TLS" | "WS" | "WSS";
  websocketPath?: string;
  displayName?: string;
}

export type TransportOption = {
  value: "UDP" | "TCP" | "TLS" | "WS" | "WSS";
  label: string;
};

export const TRANSPORT_OPTIONS: TransportOption[] = [
  { value: "UDP", label: "UDP" },
  { value: "TCP", label: "TCP" },
  { value: "TLS", label: "TLS (Secure)" },
  { value: "WS", label: "WebSocket" },
  { value: "WSS", label: "WebSocket Secure (WSS)" },
];

export const DEFAULT_PORTS: Record<string, number> = {
  UDP: 5060,
  TCP: 5060,
  TLS: 5061,
  WS: 8088,
  WSS: 8088,
};
