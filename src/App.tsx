import { useState, useEffect } from "react";
import { AccountManager } from "@/components/accounts/AccountManager";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { Dialpad } from "@/components/dialpad/Dialpad";
import type { SIPAccount } from "@/types/sip";
import { StorageService } from "@/services/storageService";
import { SIPService } from "@/services/sipService";
import { useCall } from "@/hooks/useCall";

function App() {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<SIPAccount | null>(null);

  const storageService = StorageService.getInstance();
  const sipService = SIPService.getInstance();
  const {
    callState,
    makeCall,
    hangupCall,
    formatDuration,
    isInCall,
    isCallActive,
  } = useCall();

  useEffect(() => {
    // Load accounts on app start
    const savedAccounts = storageService.getSIPAccounts();
    const activeAccountId = storageService.getActiveAccountId();

    // Reset all accounts to unregistered on page load since SIP connections are lost
    const resetAccounts = savedAccounts.map((account) => ({
      ...account,
      registrationStatus: "unregistered" as const,
    }));

    // Update storage with reset status
    resetAccounts.forEach((account) => {
      storageService.updateSIPAccount(account.id, {
        registrationStatus: "unregistered",
      });
    });

    setAccounts(resetAccounts);

    if (activeAccountId) {
      const active = resetAccounts.find((acc) => acc.id === activeAccountId);
      setActiveAccount(active || null);
    }

    // Listen for registration status changes
    const handleStatusChange = () => {
      const updatedAccounts = storageService.getSIPAccounts();
      setAccounts(updatedAccounts);

      if (activeAccountId) {
        const updatedActive = updatedAccounts.find(
          (acc) => acc.id === activeAccountId
        );
        setActiveAccount(updatedActive || null);
      }
    };

    sipService.on("registrationStatusChanged", handleStatusChange);

    return () => {
      sipService.off("registrationStatusChanged");
    };
  }, [storageService, sipService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sipService.destroy();
    };
  }, [sipService]);

  const handleAccountSelect = (account: SIPAccount) => {
    setActiveAccount(account);
    // Account selection only sets the active account, registration is handled by explicit button clicks
  };

  const handleAccountChange = (accountId: string) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (account) {
      handleAccountSelect(account);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Simple Softphone</h1>
            {accounts.length > 0 && activeAccount && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">Active Account</div>
                  <div className="text-xs text-muted-foreground">
                    {activeAccount.name}
                  </div>
                </div>
                <AccountSelector
                  accounts={accounts}
                  activeAccountId={activeAccount?.id || null}
                  onAccountChange={handleAccountChange}
                />
              </div>
            )}
          </div>
        </header>

        <main className="grid gap-8 md:grid-cols-2">
          <section>
            <AccountManager onAccountSelect={handleAccountSelect} />
          </section>

          <section>
            {activeAccount ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Call Interface</h2>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        activeAccount.registrationStatus === "registered"
                          ? "bg-green-500"
                          : activeAccount.registrationStatus === "connecting"
                          ? "bg-yellow-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    />
                    <p className="text-sm text-muted-foreground">
                      {activeAccount.registrationStatus === "registered"
                        ? isCallActive
                          ? `Call ${callState.status}${
                              isInCall
                                ? ` - ${formatDuration(callState.duration)}`
                                : ""
                            }`
                          : "Ready to make calls"
                        : activeAccount.registrationStatus === "connecting"
                        ? "Connecting to SIP server..."
                        : "Not connected - check account settings"}
                    </p>
                  </div>
                </div>

                {activeAccount.registrationStatus === "registered" ? (
                  <div className="space-y-4">
                    {/* Call Status Display */}
                    {isCallActive && (
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <div className="text-sm font-medium mb-1">
                          {callState.status === "calling" && "Calling..."}
                          {callState.status === "ringing" && "Ringing..."}
                          {callState.status === "connected" && "Connected"}
                          {callState.status === "ended" && "Call Ended"}
                        </div>
                        {callState.remoteNumber && (
                          <div className="text-lg font-mono">
                            {callState.remoteNumber}
                          </div>
                        )}
                        {isInCall && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Duration: {formatDuration(callState.duration)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Dialpad */}
                    <Dialpad
                      onCall={makeCall}
                      onHangup={hangupCall}
                      disabled={
                        activeAccount.registrationStatus !== "registered"
                      }
                      isInCall={isInCall}
                    />
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-8 text-center">
                    <div className="text-muted-foreground">
                      <p className="mb-2">
                        {activeAccount.registrationStatus === "connecting"
                          ? "Establishing connection..."
                          : "Connection required"}
                      </p>
                      {activeAccount.registrationStatus === "failed" && (
                        <p className="text-sm text-destructive">
                          Registration failed. Please check your account
                          settings.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted/30 rounded-lg">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg mb-2">No Account Selected</p>
                  <p className="text-sm">
                    Select or add a SIP account to start making calls
                  </p>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default App;
