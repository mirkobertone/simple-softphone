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
        <header className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Simple Softphone</h1>

          {accounts.length > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Active Account:</span>
              <AccountSelector
                accounts={accounts}
                activeAccountId={activeAccount?.id || null}
                onAccountChange={handleAccountChange}
              />
            </div>
          )}
        </header>

        <main className="grid gap-6 md:grid-cols-2">
          <div>
            <AccountManager onAccountSelect={handleAccountSelect} />
          </div>

          <div>
            {activeAccount ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Call Interface</h3>
                <p className="text-muted-foreground">
                  Ready to make calls with:{" "}
                  <strong>{activeAccount.name}</strong>
                </p>
                {/* TODO: Add dialpad and call controls here */}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Select or add a SIP account to start making calls</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
