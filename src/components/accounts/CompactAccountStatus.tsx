import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SIPAccount } from "@/types/sip";

interface CompactAccountStatusProps {
  activeAccount: SIPAccount | null;
  onManageAccounts: () => void;
}

export function CompactAccountStatus({
  activeAccount,
  onManageAccounts,
}: CompactAccountStatusProps) {
  if (!activeAccount) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <div className="text-sm text-muted-foreground">No account selected</div>
        <Button variant="outline" size="sm" onClick={onManageAccounts}>
          <Settings className="w-4 h-4 mr-2" />
          Manage Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${
            activeAccount.registrationStatus === "registered"
              ? "bg-green-500"
              : activeAccount.registrationStatus === "connecting"
              ? "bg-yellow-500 animate-pulse"
              : "bg-red-500"
          }`}
        />
        <div>
          <div className="text-sm font-medium">{activeAccount.name}</div>
          <div className="text-xs text-muted-foreground">
            {activeAccount.userId}@{activeAccount.server}
          </div>
        </div>
        <Badge
          variant={
            activeAccount.registrationStatus === "registered"
              ? "default"
              : activeAccount.registrationStatus === "connecting"
              ? "secondary"
              : activeAccount.registrationStatus === "failed"
              ? "destructive"
              : "outline"
          }
          className="text-xs"
        >
          {activeAccount.registrationStatus === "registered"
            ? "Connected"
            : activeAccount.registrationStatus === "connecting"
            ? "Connecting"
            : activeAccount.registrationStatus === "failed"
            ? "Failed"
            : "Disconnected"}
        </Badge>
      </div>
      <Button variant="ghost" size="sm" onClick={onManageAccounts}>
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
}
