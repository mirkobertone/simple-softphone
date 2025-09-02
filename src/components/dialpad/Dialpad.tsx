import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DialButton } from "./DialButton";
import { Phone, PhoneCall, Delete } from "lucide-react";

interface DialpadProps {
  onCall: (number: string) => void;
  disabled?: boolean;
  isCallActive?: boolean;
}

const dialpadButtons = [
  { digit: "1", letters: "" },
  { digit: "2", letters: "ABC" },
  { digit: "3", letters: "DEF" },
  { digit: "4", letters: "GHI" },
  { digit: "5", letters: "JKL" },
  { digit: "6", letters: "MNO" },
  { digit: "7", letters: "PQRS" },
  { digit: "8", letters: "TUV" },
  { digit: "9", letters: "WXYZ" },
  { digit: "*", letters: "" },
  { digit: "0", letters: "+" },
  { digit: "#", letters: "" },
];

export function Dialpad({
  onCall,
  disabled = false,
  isCallActive = false,
}: DialpadProps) {
  const [number, setNumber] = useState("");

  const handleDigitClick = (digit: string) => {
    if (!disabled) {
      setNumber((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (number.trim() && !disabled) {
      onCall(number.trim());
      setNumber(""); // Clear after initiating call
    }
  };

  const handleClear = () => {
    setNumber("");
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-gradient-to-b from-card to-card/95">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
          <Phone className="h-6 w-6 text-primary" />
          Dialpad
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 px-6 pb-6">
        {/* Number Display */}
        <div className="space-y-3">
          <div className="relative">
            <Input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="Enter phone number"
              className="text-center text-xl font-mono h-14 border-2 focus:border-primary/50 transition-colors bg-background/50"
              disabled={disabled}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackspace}
              disabled={disabled || !number}
              className="flex-1 h-10 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <Delete className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled || !number}
              className="flex-1 h-10 hover:bg-muted transition-colors"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Dialpad Grid */}
        <div className="grid grid-cols-3 gap-4 justify-items-center">
          {dialpadButtons.map(({ digit, letters }) => (
            <DialButton
              key={digit}
              digit={digit}
              letters={letters}
              onClick={handleDigitClick}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Call Button */}
        <div className="pt-2">
          <Button
            className="w-full h-14 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleCall}
            disabled={disabled || !number.trim() || isCallActive}
            variant={isCallActive ? "secondary" : "default"}
          >
            <PhoneCall className="h-5 w-5 mr-2" />
            {isCallActive ? "Call in Progress" : "Call"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
