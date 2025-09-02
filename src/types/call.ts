export type CallState =
  | "idle"
  | "connecting"
  | "ringing"
  | "active"
  | "held"
  | "ended";

export interface CallSession {
  id: string;
  direction: "incoming" | "outgoing";
  remoteNumber: string;
  remoteDisplayName?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  state: CallState;
  accountId: string; // Which SIP account is handling this call
}

export interface MediaDevices {
  audioInput: MediaDeviceInfo[];
  audioOutput: MediaDeviceInfo[];
  selectedAudioInput?: string;
  selectedAudioOutput?: string;
}
