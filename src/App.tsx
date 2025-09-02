import { useState, useEffect } from "react";
import { AccountManager } from "@/components/accounts/AccountManager";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import type { SIPAccount } from "@/types/sip";
import { StorageService } from "@/services/storageService";

function App() {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<SIPAccount | null>(null);

  const storageService = StorageService.getInstance();

  useEffect(() => {
    // Load accounts on app start
    const savedAccounts = storageService.getSIPAccounts();
    const activeAccountId = storageService.getActiveAccountId();

    setAccounts(savedAccounts);

    if (activeAccountId) {
      const active = savedAccounts.find((acc) => acc.id === activeAccountId);
      setActiveAccount(active || null);
    }
  }, [storageService]);

  const handleAccountSelect = (account: SIPAccount) => {
    setActiveAccount(account);
    // TODO: Initialize SIP connection with selected account
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
                  <p className="text-sm text-muted-foreground">
                    Ready to make calls
                  </p>
                </div>
                {/* TODO: Add dialpad and call controls here */}
                <div className="bg-muted/30 rounded-lg p-8 text-center text-muted-foreground">
                  <p>Dialpad and call controls will appear here</p>
                </div>
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
