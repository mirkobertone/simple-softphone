import { useState, useEffect } from "react";
import { AccountManager } from "@/components/accounts/AccountManager";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { Dialpad } from "@/components/dialpad/Dialpad";
import { Phone, PhoneCall, PhoneOff } from "lucide-react";
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

  // Load accounts on app start
  useEffect(() => {
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
  }, [storageService]);

  // Listen for registration status changes (separate effect to handle dependencies properly)
  useEffect(() => {
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

      // Update active account if it exists - using current activeAccount from closure
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
  }, [storageService, sipService, activeAccount]);

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
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
              Simple Softphone
            </h1>

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

        <main className="space-y-12">
          {/* Step 1: Account Management */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center shadow-sm">
                1
              </div>
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                Configure SIP Account
              </h2>
            </div>
            <AccountManager onAccountSelect={handleAccountSelect} />
          </section>

          {/* Step 2: Make Calls */}
          {activeAccount && (
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center shadow-sm ${
                    activeAccount.registrationStatus === "registered"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  Make Calls
                </h2>
              </div>

              <div className="flex flex-col items-center space-y-8">
                {/* Call Status */}
                <div className="w-full max-w-md">
                  {isCallActive && (
                    <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-700 shadow-lg">
                      <div className="mb-4">
                        <div
                          className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
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
                            <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse flex items-center justify-center">
                              <Phone className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {callState.status === "ringing" && (
                            <div className="w-8 h-8 rounded-full bg-yellow-500 animate-bounce flex items-center justify-center">
                              <PhoneCall className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {callState.status === "connected" && (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                              <PhoneCall className="w-4 h-4 text-white" />
                            </div>
                          )}
                          {callState.status === "ended" && (
                            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                              <PhoneOff className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          {callState.status === "calling" && "Calling..."}
                          {callState.status === "ringing" && "Ringing..."}
                          {callState.status === "connected" && "Connected"}
                          {callState.status === "ended" && "Call Ended"}
                        </div>
                      </div>

                      {callState.remoteNumber && (
                        <div className="text-2xl font-mono font-medium mb-4 text-slate-900 dark:text-slate-100">
                          {callState.remoteNumber}
                        </div>
                      )}

                      {isInCall && (
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 inline-block">
                          {formatDuration(callState.duration)}
                        </div>
                      )}
                    </div>
                  )}

                  {!isCallActive &&
                    activeAccount.registrationStatus !== "registered" && (
                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-3xl p-8 text-center border border-amber-200 dark:border-amber-800">
                        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                            {activeAccount.registrationStatus ===
                            "connecting" ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="text-white text-sm font-bold">
                                !
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-amber-800 dark:text-amber-200">
                          <p className="mb-2 font-semibold">
                            {activeAccount.registrationStatus === "connecting"
                              ? "Establishing connection..."
                              : "Connection required"}
                          </p>
                          <p className="text-sm opacity-80">
                            {activeAccount.registrationStatus === "failed"
                              ? "Registration failed. Please check your account settings."
                              : "Click the Connect button in your account above."}
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
