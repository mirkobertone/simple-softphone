import { useState } from "react";
import { Phone, PhoneCall, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface DialpadProps {
  onCall?: (number: string) => void;
  onHangup?: () => void;
  disabled?: boolean;
  isInCall?: boolean;
}

const dialpadButtons = [
  { number: "1", letters: "" },
  { number: "2", letters: "ABC" },
  { number: "3", letters: "DEF" },
  { number: "4", letters: "GHI" },
  { number: "5", letters: "JKL" },
  { number: "6", letters: "MNO" },
  { number: "7", letters: "PQRS" },
  { number: "8", letters: "TUV" },
  { number: "9", letters: "WXYZ" },
  { number: "*", letters: "" },
  { number: "0", letters: "+" },
  { number: "#", letters: "" },
];

export function Dialpad({
  onCall,
  onHangup,
  disabled = false,
  isInCall = false,
}: DialpadProps) {
  const [phoneNumber, setPhoneNumber] = useState("");

  const handleNumberClick = (number: string) => {
    if (disabled) return;
    setPhoneNumber((prev) => prev + number);
  };

  const handleBackspace = () => {
    if (disabled) return;
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!phoneNumber.trim() || disabled) return;
    onCall?.(phoneNumber.trim());
  };

  const handleHangup = () => {
    onHangup?.();
    setPhoneNumber("");
  };

  const handleInputChange = (value: string) => {
    // Only allow numbers, +, *, #
    const cleanValue = value.replace(/[^0-9+*#]/g, "");
    setPhoneNumber(cleanValue);
  };

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="pb-4">
        <div className="space-y-2">
          <Input
            value={phoneNumber}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Enter phone number"
            className="text-center text-lg font-mono"
            disabled={disabled}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dialpad Grid */}
        <div className="grid grid-cols-3 gap-3">
          {dialpadButtons.map(({ number, letters }) => (
            <Button
              key={number}
              variant="outline"
              size="lg"
              className="h-16 flex flex-col items-center justify-center hover:bg-muted/50 active:scale-95 transition-all"
              onClick={() => handleNumberClick(number)}
              disabled={disabled}
            >
              <span className="text-xl font-semibold">{number}</span>
              {letters && (
                <span className="text-xs text-muted-foreground mt-1">
                  {letters}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          {/* Backspace Button */}
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12"
            onClick={handleBackspace}
            disabled={disabled || phoneNumber.length === 0}
          >
            <Delete className="w-5 h-5" />
          </Button>

          {/* Call/Hangup Button */}
          {isInCall ? (
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 h-12"
              onClick={handleHangup}
              disabled={disabled}
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Hang Up
            </Button>
          ) : (
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-12 bg-green-600 hover:bg-green-700"
              onClick={handleCall}
              disabled={disabled || phoneNumber.length === 0}
            >
              <Phone className="w-5 h-5 mr-2" />
              Call
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
