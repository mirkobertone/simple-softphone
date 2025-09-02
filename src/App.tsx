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
    const handleStatusChange = (accountId: string, status: string) => {
      console.log(
        `[App] Registration status changed for ${accountId}: ${status}`
      );

      const updatedAccounts = storageService.getSIPAccounts();
      console.log(
        `[App] Updated accounts:`,
        updatedAccounts.map((acc) => ({
          id: acc.id,
          status: acc.registrationStatus,
        }))
      );

      setAccounts(updatedAccounts);

      // Update active account if it exists
      if (activeAccount) {
        console.log(`[App] Current active account:`, activeAccount.id);
        const updatedActive = updatedAccounts.find(
          (acc) => acc.id === activeAccount.id
        );
        console.log(
          `[App] Updated active account:`,
          updatedActive?.registrationStatus
        );
        setActiveAccount(updatedActive || null);
      }
    };

    sipService.on("registrationStatusChanged", handleStatusChange);

    return () => {
      sipService.off("registrationStatusChanged", handleStatusChange);
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
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Simple Softphone</h1>

            {/* Active Account Status Bar */}
            {activeAccount && (
              <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      activeAccount.registrationStatus === "registered"
                        ? "bg-green-500"
                        : activeAccount.registrationStatus === "connecting"
                        ? "bg-yellow-500 animate-pulse"
                        : "bg-red-500"
                    }`}
                  />
                  <div className="text-sm">
                    <span className="font-medium">{activeAccount.name}</span>
                    <span className="text-muted-foreground ml-2">
                      {activeAccount.registrationStatus === "registered"
                        ? isCallActive
                          ? `Call ${callState.status}${
                              isInCall
                                ? ` - ${formatDuration(callState.duration)}`
                                : ""
                            }`
                          : "Ready to make calls"
                        : activeAccount.registrationStatus === "connecting"
                        ? "Connecting..."
                        : "Not connected"}
                    </span>
                  </div>
                </div>

                {accounts.length > 1 && (
                  <AccountSelector
                    accounts={accounts}
                    activeAccountId={activeAccount?.id || null}
                    onAccountChange={handleAccountChange}
                  />
                )}
              </div>
            )}
          </div>
        </header>

        <main className="space-y-8">
          {/* Step 1: Account Management */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center">
                1
              </div>
              <h2 className="text-lg font-semibold">Configure SIP Account</h2>
            </div>
            <AccountManager onAccountSelect={handleAccountSelect} />
          </section>

          {/* Step 2: Make Calls */}
          {activeAccount && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full text-sm font-medium flex items-center justify-center ${
                    activeAccount.registrationStatus === "registered"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <h2 className="text-lg font-semibold">Make Calls</h2>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Call Status */}
                <div className="space-y-4">
                  {isCallActive && (
                    <div className="bg-muted/30 rounded-lg p-6 text-center border-l-4 border-primary">
                      <div className="text-lg font-medium mb-2">
                        {callState.status === "calling" && "📞 Calling..."}
                        {callState.status === "ringing" && "📳 Ringing..."}
                        {callState.status === "connected" && "✅ Connected"}
                        {callState.status === "ended" && "📴 Call Ended"}
                      </div>
                      {callState.remoteNumber && (
                        <div className="text-xl font-mono mb-2">
                          {callState.remoteNumber}
                        </div>
                      )}
                      {isInCall && (
                        <div className="text-sm text-muted-foreground">
                          Duration: {formatDuration(callState.duration)}
                        </div>
                      )}
                    </div>
                  )}

                  {!isCallActive &&
                    activeAccount.registrationStatus !== "registered" && (
                      <div className="bg-muted/30 rounded-lg p-6 text-center">
                        <div className="text-muted-foreground">
                          <p className="mb-2 font-medium">
                            {activeAccount.registrationStatus === "connecting"
                              ? "🔄 Establishing connection..."
                              : "⚠️ Connection required"}
                          </p>
                          <p className="text-sm">
                            {activeAccount.registrationStatus === "failed"
                              ? "Registration failed. Please check your account settings."
                              : "Click the Register button in your account to connect."}
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                {/* Dialpad */}
                <div className="flex justify-center">
                  <Dialpad
                    onCall={makeCall}
                    onHangup={hangupCall}
                    disabled={activeAccount.registrationStatus !== "registered"}
                    isInCall={isInCall}
                  />
                </div>
              </div>
            </section>
          )}

          {/* No Account State */}
          {!activeAccount && accounts.length === 0 && (
            <section className="text-center py-12">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl mb-4">📞</div>
                <h2 className="text-2xl font-semibold">
                  Welcome to Simple Softphone
                </h2>
                <p className="text-muted-foreground">
                  Get started by adding your first SIP account. You'll need your
                  SIP server details from your VoIP provider.
                </p>
              </div>
            </section>
          )}

          {!activeAccount && accounts.length > 0 && (
            <section className="text-center py-8">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-4xl mb-4">👆</div>
                <h2 className="text-xl font-semibold">Select an Account</h2>
                <p className="text-muted-foreground">
                  Click on one of your SIP accounts above to start making calls.
                </p>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
