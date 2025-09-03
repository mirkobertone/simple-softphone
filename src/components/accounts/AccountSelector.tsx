import { useState, useEffect } from "react";
import { LogIn, LogOut, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SIPAccount } from "@/types/sip";
import { StorageService } from "@/services/storageService";
import { SIPService } from "@/services/sipService";

interface AccountSelectorProps {
  activeAccount: SIPAccount | null;
  onAccountSelect: (account: SIPAccount) => void;
}

export function AccountSelector({
  activeAccount,
  onAccountSelect,
}: AccountSelectorProps) {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  const storageService = StorageService.getInstance();
  const sipService = SIPService.getInstance();

  // Load accounts
  useEffect(() => {
    const loadAccounts = () => {
      const savedAccounts = storageService.getSIPAccounts();
      setAccounts(savedAccounts);
    };

    loadAccounts();

    // Listen for registration status changes to update connection state
    const handleStatusChange = (_accountId: string, status: string) => {
      setIsConnecting(status === "connecting");
      // Reload accounts to get updated status
      loadAccounts();
    };

    sipService.on("registrationStatusChanged", handleStatusChange);

    return () => {
      sipService.off("registrationStatusChanged", handleStatusChange);
    };
  }, [storageService, sipService]);

  const handleAccountChange = (accountId: string) => {
    const selectedAccount = accounts.find((acc) => acc.id === accountId);
    if (selectedAccount) {
      onAccountSelect(selectedAccount);
      storageService.setActiveAccountId(accountId);
    }
  };

  const handleConnect = async () => {
    if (!activeAccount) return;

    setIsConnecting(true);
    try {
      await sipService.registerAccount(activeAccount);
    } catch (error) {
      console.error("Failed to connect:", error);
    }
    // setIsConnecting will be updated via the status change listener
  };

  const handleDisconnect = async () => {
    if (!activeAccount) return;

    try {
      await sipService.unregister();
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const getConnectionStatus = () => {
    if (!activeAccount) return null;

    switch (activeAccount.registrationStatus) {
      case "registered":
        return {
          label: "Connected",
          color: "bg-green-500",
          variant: "default" as const,
        };
      case "connecting":
        return {
          label: "Connecting",
          color: "bg-yellow-500 animate-pulse",
          variant: "secondary" as const,
        };
      case "failed":
        return {
          label: "Failed",
          color: "bg-red-500",
          variant: "destructive" as const,
        };
      default:
        return {
          label: "Disconnected",
          color: "bg-gray-500",
          variant: "outline" as const,
        };
    }
  };

  const connectionStatus = getConnectionStatus();

  if (accounts.length === 0) {
    return (
      <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          No accounts configured
        </div>
        <span className="text-xs text-muted-foreground">
          Use the Accounts tab to add accounts
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      {/* Account Selector and Status */}
      <div className="flex items-center gap-4 flex-1">
        {/* Account Dropdown */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Select
            value={activeAccount?.id || ""}
            onValueChange={handleAccountChange}
          >
            <SelectTrigger className="w-full max-w-xs bg-background/50">
              <div className="flex items-center gap-2 min-w-0">
                {connectionStatus && (
                  <div
                    className={`w-2 h-2 rounded-full ${connectionStatus.color}`}
                  />
                )}
                <SelectValue
                  placeholder="Select account..."
                  className="truncate"
                >
                  {activeAccount && (
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">
                        {activeAccount.name}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {activeAccount.userId}@{activeAccount.server}
                      </span>
                    </div>
                  )}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        account.registrationStatus === "registered"
                          ? "bg-green-500"
                          : account.registrationStatus === "connecting"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{account.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {account.userId}@{account.server}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Connection Status Badge */}
          {connectionStatus && activeAccount && (
            <Badge
              variant={connectionStatus.variant}
              className="text-xs shrink-0"
            >
              {connectionStatus.label}
            </Badge>
          )}
        </div>

        {/* Connection Control Button */}
        {activeAccount && (
          <div className="flex items-center gap-2">
            {activeAccount.registrationStatus === "registered" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-red-600 hover:text-red-700 hover:border-red-200"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            ) : isConnecting ||
              activeAccount.registrationStatus === "connecting" ? (
              <Button variant="outline" size="sm" disabled>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Connecting...
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleConnect}
                className="text-green-600 hover:text-green-700 hover:border-green-200"
              >
                <LogIn className="w-4 h-4 mr-1" />
                Connect
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
