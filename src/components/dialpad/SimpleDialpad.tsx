import { Phone, PhoneOff, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SimpleDialpadProps {
  onNumberClick?: (number: string) => void;
  onBackspace?: () => void;
  onCall?: () => void;
  onHangup?: () => void;
  disabled?: boolean;
  isInCall?: boolean;
  canCall?: boolean;
}

const dialpadButtons = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "*",
  "0",
  "#",
];

export function SimpleDialpad({
  onNumberClick,
  onBackspace,
  onCall,
  onHangup,
  disabled = false,
  isInCall = false,
  canCall = false,
}: SimpleDialpadProps) {
  const handleNumberClick = (number: string) => {
    if (disabled) return;
    onNumberClick?.(number);
  };

  const handleBackspace = () => {
    if (disabled) return;
    onBackspace?.();
  };

  const handleCall = () => {
    if (disabled || !canCall) return;
    onCall?.();
  };

  const handleHangup = () => {
    onHangup?.();
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Dialpad Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {dialpadButtons.map((number) => (
          <Button
            key={number}
            variant="ghost"
            className="h-16 w-16 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm hover:shadow-md active:scale-95 transition-all duration-150 text-xl font-semibold text-slate-800 dark:text-slate-200 hover:border-primary/30"
            onClick={() => handleNumberClick(number)}
            disabled={disabled}
          >
            {number}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        {/* Backspace Button */}
        <Button
          variant="ghost"
          size="lg"
          className="h-14 w-14 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-all duration-150"
          onClick={handleBackspace}
          disabled={disabled}
        >
          <Delete className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Button>

        {/* Call/Hangup Button */}
        {isInCall ? (
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 border-0"
            onClick={handleHangup}
            disabled={disabled}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-16 w-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl active:scale-95 transition-all duration-150 border-0 disabled:bg-slate-300 disabled:text-slate-500"
            onClick={handleCall}
            disabled={disabled || !canCall}
          >
            <Phone className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
