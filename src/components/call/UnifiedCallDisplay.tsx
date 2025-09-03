import { useState, useEffect } from "react";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
import { Input } from "@/components/ui/input";

// Using the CallState type from useCall hook
interface CallState {
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  remoteNumber: string | null;
  session: unknown | null;
  duration: number;
}

interface UnifiedCallDisplayProps {
  callState: CallState;
  isInCall: boolean;
  isCallActive: boolean;
  formatDuration: (seconds: number) => string;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
  disabled?: boolean;
}

export function UnifiedCallDisplay({
  callState,
  isInCall,
  isCallActive,
  formatDuration,
  phoneNumber,
  onPhoneNumberChange,
  disabled = false,
}: UnifiedCallDisplayProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Trigger transition animation when call state changes
  useEffect(() => {
    if (callState.status === "calling" || callState.status === "ended") {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [callState.status]);

  const handleInputChange = (value: string) => {
    // Only allow numbers, +, *, #
    const cleanValue = value.replace(/[^0-9+*#]/g, "");
    onPhoneNumberChange(cleanValue);
  };

  // Get display content based on call state
  const getDisplayContent = () => {
    if (isCallActive) {
      return {
        showInput: false,
        primaryText: callState.remoteNumber || "Unknown",
        secondaryText: isInCall
          ? formatDuration(callState.duration)
          : getStatusText(),
        icon: getStatusIcon(),
        backgroundColor: getStatusBackgroundColor(),
        textColor: "text-slate-900 dark:text-slate-100",
      };
    }

    return {
      showInput: true,
      primaryText: "",
      secondaryText: "",
      icon: null,
      backgroundColor:
        "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900",
      textColor: "text-slate-800 dark:text-slate-200",
    };
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

  const getStatusBackgroundColor = () => {
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

  const displayContent = getDisplayContent();

  return (
    <div className="w-full max-w-md mx-auto mb-6">
      <div
        className={`
          ${displayContent.backgroundColor}
          rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg
          transition-all duration-500 ease-in-out transform
          ${isTransitioning ? "scale-105 shadow-xl" : "scale-100"}
          ${isCallActive ? "p-8 min-h-[200px]" : "p-4 min-h-[80px]"}
        `}
      >
        <div className="flex items-center justify-center min-h-[60px]">
          {displayContent.showInput ? (
            // Input Mode
            <div className="w-full animate-in fade-in-50 duration-300">
              <Input
                value={phoneNumber}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Enter phone number"
                className="text-center text-xl font-mono h-14 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
                disabled={disabled}
              />
            </div>
          ) : (
            // Call Status Mode
            <div className="text-center animate-in fade-in-50 duration-300">
              {/* Status Icon */}
              {displayContent.icon && (
                <div className="flex justify-center mb-4 animate-in zoom-in-50 duration-500">
                  {displayContent.icon}
                </div>
              )}

              {/* Primary Text (Phone Number) */}
              <div
                className={`text-2xl font-mono font-semibold mb-2 ${displayContent.textColor} animate-in slide-in-from-bottom-2 duration-400`}
              >
                {displayContent.primaryText}
              </div>

              {/* Secondary Text (Status/Duration) */}
              {displayContent.secondaryText && (
                <div
                  className={`text-lg font-medium ${displayContent.textColor} opacity-80 animate-in slide-in-from-bottom-1 duration-500`}
                >
                  {displayContent.secondaryText}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
