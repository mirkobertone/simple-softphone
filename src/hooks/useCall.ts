import { useState, useEffect, useCallback } from "react";
import { SIPService } from "@/services/sipService";

export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface CallState {
  status: CallStatus;
  remoteNumber: string | null;
  session: any | null;
  duration: number;
}

export function useCall() {
  const [callState, setCallState] = useState<CallState>({
    status: "idle",
    remoteNumber: null,
    session: null,
    duration: 0,
  });

  const sipService = SIPService.getInstance();

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (callState.status === "connected") {
      interval = setInterval(() => {
        setCallState((prev) => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState.status]);

  // Set up SIP event listeners
  useEffect(() => {
    const handleIncomingCall = (session: any) => {
      console.log("Incoming call received:", session);
      setCallState({
        status: "ringing",
        remoteNumber: session.remote_identity?.uri?.user || "Unknown",
        session,
        duration: 0,
      });
    };

    const handleCallEnded = (session: any) => {
      console.log("Call ended:", session);
      setCallState({
        status: "ended",
        remoteNumber: null,
        session: null,
        duration: 0,
      });

      // Reset to idle after a brief delay
      setTimeout(() => {
        setCallState((prev) => ({ ...prev, status: "idle" }));
      }, 2000);
    };

    sipService.on("incomingCall", handleIncomingCall);
    sipService.on("callEnded", handleCallEnded);

    return () => {
      sipService.off("incomingCall", handleIncomingCall);
      sipService.off("callEnded", handleCallEnded);
    };
  }, [sipService]);

  const makeCall = useCallback(
    (phoneNumber: string) => {
      if (!phoneNumber.trim()) return false;

      console.log(`Attempting to call: ${phoneNumber}`);

      try {
        const session = sipService.makeCall(phoneNumber);

        if (session) {
          setCallState({
            status: "calling",
            remoteNumber: phoneNumber,
            session,
            duration: 0,
          });

          // Set up session event handlers
          session.on("connecting", () => {
            console.log("Call connecting...");
            setCallState((prev) => ({ ...prev, status: "calling" }));
          });

          session.on("progress", () => {
            console.log("Call ringing...");
            setCallState((prev) => ({ ...prev, status: "ringing" }));
          });

          session.on("confirmed", () => {
            console.log("Call answered!");
            setCallState((prev) => ({
              ...prev,
              status: "connected",
              duration: 0,
            }));
          });

          session.on("ended", () => {
            console.log("Call ended");
            setCallState({
              status: "ended",
              remoteNumber: null,
              session: null,
              duration: 0,
            });

            setTimeout(() => {
              setCallState((prev) => ({ ...prev, status: "idle" }));
            }, 2000);
          });

          session.on("failed", (e: any) => {
            console.error("Call failed:", e);
            setCallState({
              status: "ended",
              remoteNumber: null,
              session: null,
              duration: 0,
            });

            setTimeout(() => {
              setCallState((prev) => ({ ...prev, status: "idle" }));
            }, 2000);
          });

          return true;
        }
      } catch (error) {
        console.error("Failed to make call:", error);
      }

      return false;
    },
    [sipService]
  );

  const hangupCall = useCallback(() => {
    if (callState.session) {
      console.log("Hanging up call");
      callState.session.terminate();
    }
  }, [callState.session]);

  const answerCall = useCallback(() => {
    if (callState.session && callState.status === "ringing") {
      console.log("Answering call");
      callState.session.answer({
        mediaConstraints: { audio: true, video: false },
      });
    }
  }, [callState.session, callState.status]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return {
    callState,
    makeCall,
    hangupCall,
    answerCall,
    formatDuration,
    isInCall: callState.status === "connected",
    isCallActive: callState.status !== "idle",
  };
}
