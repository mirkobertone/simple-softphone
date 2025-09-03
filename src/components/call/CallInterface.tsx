import { useState } from "react";
import { UnifiedCallDisplay } from "./UnifiedCallDisplay";
import { SimpleDialpad } from "@/components/dialpad/SimpleDialpad";
import type { SIPAccount } from "@/types/sip";

// Using the CallState type from useCall hook
interface CallState {
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  remoteNumber: string | null;
  session: unknown | null;
  duration: number;
}

interface CallInterfaceProps {
  activeAccount: SIPAccount | null;
  callState: CallState;
  isInCall: boolean;
  isCallActive: boolean;
  formatDuration: (seconds: number) => string;
  onCall: (number: string) => void;
  onHangup: () => void;
}

export function CallInterface({
  activeAccount,
  callState,
  isInCall,
  isCallActive,
  formatDuration,
  onCall,
  onHangup,
}: CallInterfaceProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const isRegistered = activeAccount?.registrationStatus === "registered";

  const handleNumberClick = (number: string) => {
    setPhoneNumber((prev) => prev + number);
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber.trim()) return;
    onCall(phoneNumber.trim());
  };

  const handleHangup = () => {
    onHangup();
    setPhoneNumber("");
  };

  const handlePhoneNumberChange = (value: string) => {
    setPhoneNumber(value);
  };

  // Show connection status when not registered
  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center space-y-8 max-w-md mx-auto">
        <div className="w-full bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-8 text-center border border-amber-200 dark:border-amber-800">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
              {activeAccount?.registrationStatus === "connecting" ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-white text-lg font-bold">!</span>
              )}
            </div>
          </div>
          <div className="text-amber-800 dark:text-amber-200">
            <p className="mb-3 font-semibold text-lg">
              {activeAccount?.registrationStatus === "connecting"
                ? "Establishing connection..."
                : "Connection required"}
            </p>
            <p className="text-sm opacity-80">
              {activeAccount?.registrationStatus === "failed"
                ? "Registration failed. Please check your account settings."
                : activeAccount
                ? "Go to Accounts tab to connect your SIP account."
                : "Go to Accounts tab to add and connect a SIP account."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-8 max-w-md mx-auto">
      {/* Unified Call Display - transforms between input and call status */}
      <UnifiedCallDisplay
        callState={callState}
        isInCall={isInCall}
        isCallActive={isCallActive}
        formatDuration={formatDuration}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={handlePhoneNumberChange}
        disabled={!isRegistered}
      />

      {/* Simplified Dialpad */}
      <SimpleDialpad
        onNumberClick={handleNumberClick}
        onBackspace={handleBackspace}
        onCall={handleCall}
        onHangup={handleHangup}
        disabled={!isRegistered}
        isInCall={isInCall}
        canCall={phoneNumber.length > 0}
      />
    </div>
  );
}
