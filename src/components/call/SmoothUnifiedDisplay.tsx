import { useState, useEffect, useRef } from "react";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import { Input } from "@/components/ui/input";

// Using the CallState type from useCall hook
interface CallState {
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  remoteNumber: string | null;
  session: unknown | null;
  duration: number;
}

interface SmoothUnifiedDisplayProps {
  callState: CallState;
  isInCall: boolean;
  isCallActive: boolean;
  formatDuration: (seconds: number) => string;
  phoneNumber: string;
  lastDialedNumber: string;
  onPhoneNumberChange: (value: string) => void;
  disabled?: boolean;
}

export function SmoothUnifiedDisplay({
  callState,
  isInCall,
  isCallActive,
  formatDuration,
  phoneNumber,
  lastDialedNumber,
  onPhoneNumberChange,
  disabled = false,
}: SmoothUnifiedDisplayProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle mode transitions with smooth animations
  useEffect(() => {
    if (callState.status === "calling" || callState.status === "ended") {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
  }, [callState.status]);

  const handleInputChange = (value: string) => {
    const cleanValue = value.replace(/[^0-9+*#]/g, "");
    onPhoneNumberChange(cleanValue);
  };

  const getStatusIcon = () => {
    switch (callState.status) {
      case "calling":
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
        );
      case "ringing":
        return (
          <div className="w-8 h-8 rounded-full bg-yellow-500 animate-bounce flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
        );
      case "connected":
        return (
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
            <PhoneCall className="w-4 h-4 text-white" />
          </div>
        );
      case "ended":
        return (
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
            <PhoneOff className="w-4 h-4 text-white" />
          </div>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (callState.status) {
      case "calling":
        return "Calling...";
      case "ringing":
        return "Ringing...";
      case "connected":
        return "Connected";
      case "ended":
        return "Call Ended";
      default:
        return "";
    }
  };

  const getBackgroundColor = () => {
    if (!isCallActive) {
      return "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900";
    }

    switch (callState.status) {
      case "calling":
        return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30";
      case "ringing":
        return "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/30";
      case "connected":
        return "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30";
      case "ended":
        return "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/30";
      default:
        return "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900";
    }
  };

  const displayNumber = callState.remoteNumber || lastDialedNumber || "Unknown";

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div
        ref={containerRef}
        className={`
          ${getBackgroundColor()}
          rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg
          transition-all duration-500 ease-in-out transform
          ${isAnimating ? "scale-105 shadow-xl" : "scale-100"}
          relative overflow-hidden
        `}
        style={{
          minHeight: isCallActive ? "180px" : "80px",
        }}
      >
        {/* Input Mode */}
        <div
          className={`
            absolute inset-0 p-4 flex items-center justify-center
            transition-all duration-500 ease-in-out
            ${
              isCallActive
                ? "opacity-0 scale-95 pointer-events-none"
                : "opacity-100 scale-100"
            }
          `}
        >
          <Input
            value={phoneNumber}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter phone number"
            className="text-center text-xl font-mono h-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
            disabled={disabled}
          />
        </div>

        {/* Call Status Mode */}
        <div
          className={`
            absolute inset-0 p-8 flex flex-col items-center justify-center text-center
            transition-all duration-500 ease-in-out
            ${
              isCallActive
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95 pointer-events-none"
            }
          `}
        >
          {/* Status Icon */}
          {getStatusIcon() && (
            <div className="mb-4 transition-all duration-300">
              {getStatusIcon()}
            </div>
          )}

          {/* Phone Number */}
          <div className="text-2xl font-mono font-semibold mb-2 text-slate-900 dark:text-slate-100 transition-all duration-300">
            {displayNumber}
          </div>

          {/* Status Text or Duration */}
          <div className="text-lg font-medium text-slate-900 dark:text-slate-100 opacity-80 transition-all duration-300">
            {isInCall ? formatDuration(callState.duration) : getStatusText()}
          </div>
        </div>
      </div>
    </div>
  );
}
