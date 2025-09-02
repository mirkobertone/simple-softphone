/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from "react";
import { SIPService } from "@/services/sipService";

export type CallStatus = "idle" | "calling" | "ringing" | "connected" | "ended";

export interface CallState {
  status: CallStatus;
  remoteNumber: string | null;
  session: unknown | null;
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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = document.createElement("audio");
      remoteAudioRef.current.autoplay = true;
      // Set playsInline for mobile compatibility
      (remoteAudioRef.current as any).playsInline = true;
      document.body.appendChild(remoteAudioRef.current);
    }

    return () => {
      if (
        remoteAudioRef.current &&
        document.body.contains(remoteAudioRef.current)
      ) {
        document.body.removeChild(remoteAudioRef.current);
      }
    };
  }, []);

  // Function to handle audio streams
  const setupAudioStream = useCallback((session: unknown) => {
    console.log("Setting up audio stream for session:", session);

    // Wait for the connection to be established
    const handleConnectionEstablished = () => {
      console.log("Connection established, setting up remote audio");

      // Get the remote stream from the peer connection
      const peerConnection = (session as any).connection;
      if (peerConnection) {
        const remoteStreams = peerConnection.getRemoteStreams();
        console.log("Remote streams:", remoteStreams);

        if (remoteStreams.length > 0) {
          const remoteStream = remoteStreams[0];
          console.log(
            "Attaching remote stream to audio element:",
            remoteStream
          );

          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStream;
            remoteAudioRef.current.play().catch((error) => {
              console.error("Error playing remote audio:", error);
            });
          }
        }
      }
    };

    // Listen for when the peer connection is established
    (session as any).on("peerconnection", (e: unknown) => {
      console.log("Peer connection event:", e);
      const pc = (e as any).peerconnection;

      pc.ontrack = (event: RTCTrackEvent) => {
        console.log("Received remote track:", event);
        if (event.streams && event.streams[0]) {
          console.log("Attaching remote stream to audio element");
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = event.streams[0];
            remoteAudioRef.current.play().catch((error) => {
              console.error("Error playing remote audio:", error);
            });
          }
        }
      };
    });

    // Also try immediate setup if connection is already established
    setTimeout(handleConnectionEstablished, 100);
  }, []);

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
    const handleIncomingCall = (session: unknown) => {
      console.log("Incoming call received:", session);
      setCallState({
        status: "ringing",
        remoteNumber: (session as any).remote_identity?.uri?.user || "Unknown",
        session,
        duration: 0,
      });
    };

    const handleCallEnded = (session: unknown) => {
      console.log("Call ended:", session);
      // Clean up audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
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
          (session as any).on("connecting", () => {
            console.log("Call connecting...");
            setCallState((prev) => ({ ...prev, status: "calling" }));
          });

          (session as any).on("progress", () => {
            console.log("Call ringing...");
            setCallState((prev) => ({ ...prev, status: "ringing" }));
          });

          (session as any).on("confirmed", () => {
            console.log("Call answered!");
            setCallState((prev) => ({
              ...prev,
              status: "connected",
              duration: 0,
            }));
            // Set up audio stream when call is confirmed
            setupAudioStream(session);
          });

          (session as any).on("ended", () => {
            console.log("Call ended");
            // Clean up audio
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
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

          (session as any).on("failed", (e: unknown) => {
            console.error("Call failed:", e);
            // Clean up audio
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = null;
            }
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
    [sipService, setupAudioStream]
  );

  const hangupCall = useCallback(() => {
    if (callState.session) {
      console.log("Hanging up call");
      (callState.session as any).terminate();
      // Clean up audio
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
    }
  }, [callState.session]);

  const answerCall = useCallback(() => {
    if (callState.session && callState.status === "ringing") {
      console.log("Answering call");
      (callState.session as any).answer({
        mediaConstraints: { audio: true, video: false },
      });
      // Set up audio stream when answering
      setupAudioStream(callState.session);
    }
  }, [callState.session, callState.status, setupAudioStream]);

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
