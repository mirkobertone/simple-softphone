import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import { Dialpad } from "@/components/dialpad/Dialpad";
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
  const isRegistered = activeAccount?.registrationStatus === "registered";

  return (
    <div className="flex flex-col items-center space-y-8 max-w-md mx-auto">
      {/* Call Status Display */}
      {isCallActive ? (
        <div className="w-full bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-lg">
          <div className="mb-4">
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${
                callState.status === "calling"
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : callState.status === "ringing"
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : callState.status === "connected"
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-orange-100 dark:bg-orange-900/30"
              }`}
            >
              {callState.status === "calling" && (
                <div className="w-10 h-10 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
              )}
              {callState.status === "ringing" && (
                <div className="w-10 h-10 rounded-full bg-yellow-500 animate-bounce flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
              )}
              {callState.status === "connected" && (
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <PhoneCall className="w-5 h-5 text-white" />
                </div>
              )}
              {callState.status === "ended" && (
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <PhoneOff className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              {callState.status === "calling" && "Calling..."}
              {callState.status === "ringing" && "Ringing..."}
              {callState.status === "connected" && "Connected"}
              {callState.status === "ended" && "Call Ended"}
            </div>
          </div>

          {callState.remoteNumber && (
            <div className="text-3xl font-mono font-medium mb-6 text-slate-900 dark:text-slate-100">
              {callState.remoteNumber}
            </div>
          )}

          {isInCall && (
            <div className="text-lg font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-6 py-3 inline-block">
              {formatDuration(callState.duration)}
            </div>
          )}
        </div>
      ) : !isRegistered ? (
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
      ) : (
        <div className="w-full text-center">
          <div className="text-6xl mb-6">📞</div>
          <h2 className="text-2xl font-semibold mb-2">Ready to make calls</h2>
          <p className="text-muted-foreground">
            Enter a number below and press the call button
          </p>
        </div>
      )}

      {/* Dialpad - Always visible but disabled when not registered */}
      <div className="w-full">
        <Dialpad
          onCall={onCall}
          onHangup={onHangup}
          disabled={!isRegistered}
          isInCall={isInCall}
        />
      </div>
    </div>
  );
}
