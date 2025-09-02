import * as JsSIP from "jssip";
import type { SIPAccount } from "@/types/sip";
import { StorageService } from "./storageService";

export type SIPRegistrationStatus =
  | "registered"
  | "unregistered"
  | "connecting"
  | "failed";

export interface SIPServiceEvents {
  registrationStatusChanged: (
    accountId: string,
    status: SIPRegistrationStatus
  ) => void;
  incomingCall: (session: any) => void;
  callEnded: (session: any) => void;
}

export class SIPService {
  private static instance: SIPService;
  private userAgent: JsSIP.UA | null = null;
  private currentAccount: SIPAccount | null = null;
  private eventListeners: Partial<SIPServiceEvents> = {};
  private storageService: StorageService;
  private isRegistering = false;

  private constructor() {
    this.storageService = StorageService.getInstance();
  }

  public static getInstance(): SIPService {
    if (!SIPService.instance) {
      SIPService.instance = new SIPService();
    }
    return SIPService.instance;
  }

  // Event handling
  public on<K extends keyof SIPServiceEvents>(
    event: K,
    listener: SIPServiceEvents[K]
  ): void {
    this.eventListeners[event] = listener;
  }

  public off<K extends keyof SIPServiceEvents>(event: K): void {
    delete this.eventListeners[event];
  }

  private emit<K extends keyof SIPServiceEvents>(
    event: K,
    ...args: Parameters<SIPServiceEvents[K]>
  ): void {
    const listener = this.eventListeners[event];
    if (listener) {
      // @ts-ignore - TypeScript doesn't handle this pattern well
      listener(...args);
    }
  }

  // SIP Registration
  public async registerAccount(account: SIPAccount): Promise<boolean> {
    if (this.isRegistering) {
      console.warn("Registration already in progress");
      return false;
    }

    // If already registered with the same account, don't re-register
    if (this.currentAccount?.id === account.id && this.isRegistered()) {
      console.log("Account already registered, skipping re-registration");
      return true;
    }

    try {
      this.isRegistering = true;

      // Disconnect existing connection only if it's a different account
      if (this.currentAccount && this.currentAccount.id !== account.id) {
        await this.disconnect();
      }

      // Update status to connecting
      this.updateAccountStatus(account.id, "connecting");

      // Create WebSocket URL based on transport
      const wsUrl = this.buildWebSocketUrl(account);
      const sipUri = `sip:${account.userId}@${account.server}`;

      // Configure JsSIP UA according to official documentation
      const configuration = {
        sockets: [new JsSIP.WebSocketInterface(wsUrl)],
        uri: sipUri,
        password: account.password,
        authorization_user: account.userId,
        display_name: account.displayName || account.name,
        register: true,
        session_timers: false,
        connection_recovery_min_interval: 2,
        connection_recovery_max_interval: 30,
        no_answer_timeout: 60,
        use_preloaded_route: false,
        register_expires: 300,
        registrar_server: undefined,
      };

      this.userAgent = new JsSIP.UA(configuration);
      this.currentAccount = account;

      // Set up event handlers
      this.setupEventHandlers();

      // Start the UA
      this.userAgent.start();

      return true;
    } catch (error) {
      console.error("Failed to register SIP account:", error);
      this.updateAccountStatus(account.id, "failed");
      return false;
    } finally {
      this.isRegistering = false;
    }
  }

  public async unregister(): Promise<void> {
    if (this.userAgent && this.currentAccount) {
      this.updateAccountStatus(this.currentAccount.id, "unregistered");
      this.userAgent.unregister();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.userAgent) {
      this.userAgent.stop();
      this.userAgent = null;
    }
    this.currentAccount = null;
  }

  // Helper methods
  private buildWebSocketUrl(account: SIPAccount): string {
    // Only build WebSocket URLs for WS/WSS transports
    if (account.transport !== "WS" && account.transport !== "WSS") {
      throw new Error(
        `Invalid transport for WebSocket: ${account.transport}. Use WS or WSS.`
      );
    }

    const protocol = account.transport === "WSS" ? "wss" : "ws";
    const port = account.port;

    // For WebSocket SIP, always include the port unless it's standard HTTP/HTTPS
    const shouldIncludePort =
      (protocol === "wss" && port !== 443) ||
      (protocol === "ws" && port !== 80);

    const portString = shouldIncludePort ? `:${port}` : "";

    // Build WebSocket URL for SIP over WebSocket
    // Most SIP servers (like Asterisk) require /ws path for WebSocket SIP
    const wsPath = account.websocketPath || "/ws";
    return `${protocol}://${account.server}${portString}${wsPath}`;
  }

  private setupEventHandlers(): void {
    if (!this.userAgent || !this.currentAccount) return;

    const accountId = this.currentAccount.id;

    // Registration events
    this.userAgent.on("registered", () => {
      console.log("SIP account registered successfully");
      console.log("UserAgent isRegistered():", this.userAgent?.isRegistered());
      console.log("UserAgent isConnected():", this.userAgent?.isConnected());

      // Small delay to ensure UserAgent is fully ready
      setTimeout(() => {
        this.updateAccountStatus(accountId, "registered");
      }, 100);
    });

    this.userAgent.on("unregistered", () => {
      console.log("SIP account unregistered");
      this.updateAccountStatus(accountId, "unregistered");
    });

    this.userAgent.on("registrationFailed", (e: any) => {
      console.error("SIP registration failed:", e.cause);
      this.updateAccountStatus(accountId, "failed");
    });

    // Connection events
    this.userAgent.on("connected", () => {
      console.log(
        `WebSocket connected to: ${this.buildWebSocketUrl(
          this.currentAccount!
        )}`
      );
    });

    this.userAgent.on("disconnected", (e: any) => {
      console.log("WebSocket disconnected", e);
      if (this.currentAccount) {
        this.updateAccountStatus(this.currentAccount.id, "unregistered");
      }
    });

    // Transport events for better debugging
    this.userAgent.on("transportError", (e: any) => {
      console.error("Transport error:", e);
      if (this.currentAccount) {
        this.updateAccountStatus(this.currentAccount.id, "failed");
      }
    });

    // Call events
    this.userAgent.on("newRTCSession", (e: any) => {
      console.log("New RTC session:", e.session);
      this.emit("incomingCall", e.session);
    });
  }

  private updateAccountStatus(
    accountId: string,
    status: SIPRegistrationStatus
  ): void {
    // Update in storage
    this.storageService.updateSIPAccount(accountId, {
      registrationStatus: status,
    });

    // Emit event for UI updates
    this.emit("registrationStatusChanged", accountId, status);
  }

  // Call management
  public makeCall(target: string, options?: any): any | null {
    if (!this.userAgent || !this.currentAccount) {
      console.error("No active SIP account");
      return null;
    }

    // Debug registration status
    console.log("UserAgent isRegistered():", this.userAgent.isRegistered());
    console.log("UserAgent isConnected():", this.userAgent.isConnected());
    console.log(
      "Current account status:",
      this.currentAccount.registrationStatus
    );

    // Check both connection and registration status
    if (!this.userAgent.isConnected()) {
      console.error("SIP account not connected to server");
      return null;
    }

    if (!this.userAgent.isRegistered()) {
      console.error("SIP account not registered with server");
      return null;
    }

    try {
      console.log(`Making call to: ${target}`);
      const session = this.userAgent.call(target, {
        mediaConstraints: { audio: true, video: false },
        ...options,
      });

      console.log("Call session created:", session);
      return session;
    } catch (error) {
      console.error("Failed to make call:", error);
      return null;
    }
  }

  // Getters
  public getCurrentAccount(): SIPAccount | null {
    return this.currentAccount;
  }

  public isRegistered(): boolean {
    return this.userAgent?.isRegistered() || false;
  }

  public isConnected(): boolean {
    return this.userAgent?.isConnected() || false;
  }

  // Cleanup
  public destroy(): void {
    this.disconnect();
    this.eventListeners = {};
  }
}
