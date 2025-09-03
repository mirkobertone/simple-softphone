import { useState, useEffect } from "react";
import { AccountManager } from "@/components/accounts/AccountManager";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { CallInterface } from "@/components/call/CallInterface";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/theme-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Users } from "lucide-react";
import type { SIPAccount } from "@/types/sip";
import { StorageService } from "@/services/storageService";
import { SIPService } from "@/services/sipService";
import { useCall } from "@/hooks/useCall";

function App() {
  const [activeAccount, setActiveAccount] = useState<SIPAccount | null>(null);
  const [activeTab, setActiveTab] = useState("call");

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

  // Load active account on app start
  useEffect(() => {
    const savedAccounts = storageService.getSIPAccounts();
    const activeAccountId = storageService.getActiveAccountId();

    // Reset all accounts to unregistered on page load since SIP connections are lost
    savedAccounts.forEach((account) => {
      storageService.updateSIPAccount(account.id, {
        registrationStatus: "unregistered",
      });
    });

    if (activeAccountId) {
      const updatedAccounts = storageService.getSIPAccounts();
      const active = updatedAccounts.find((acc) => acc.id === activeAccountId);
      setActiveAccount(active || null);
    }
  }, [storageService]);

  // Listen for registration status changes for the active account
  useEffect(() => {
    const handleStatusChange = (accountId: string, status: string) => {
      console.log(
        `[App] Registration status changed for ${accountId}: ${status}`
      );

      // Update active account if it matches the changed account
      if (activeAccount && activeAccount.id === accountId) {
        const updatedAccounts = storageService.getSIPAccounts();
        const updatedActive = updatedAccounts.find(
          (acc) => acc.id === accountId
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
    // Don't automatically switch tabs - let user stay in accounts view
  };

  const handleManageAccounts = () => {
    setActiveTab("accounts");
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="simple-softphone-theme">
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                Simple Softphone
              </h1>
              <ModeToggle />
            </div>

            {/* Account Selector with Connection Controls */}
            <AccountSelector
              activeAccount={activeAccount}
              onAccountSelect={handleAccountSelect}
              onManageAccounts={handleManageAccounts}
            />
          </header>

          {/* Main Tabbed Interface */}
          <main>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="call" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Call
                </TabsTrigger>
                <TabsTrigger
                  value="accounts"
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Accounts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="call" className="space-y-6">
                <CallInterface
                  activeAccount={activeAccount}
                  callState={callState}
                  isInCall={isInCall}
                  isCallActive={isCallActive}
                  formatDuration={formatDuration}
                  onCall={makeCall}
                  onHangup={hangupCall}
                />
              </TabsContent>

              <TabsContent value="accounts" className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <AccountManager />
                </div>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
