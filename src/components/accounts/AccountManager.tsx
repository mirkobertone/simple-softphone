import { useState, useEffect, useCallback } from "react";
import { Plus, Settings, Trash2, LogIn, LogOut, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "./AccountForm";
import type { SIPAccount, SIPAccountFormData } from "@/types/sip";
import { DEFAULT_PORTS } from "@/types/sip";
import { StorageService } from "@/services/storageService";
import { SIPService, type SIPRegistrationStatus } from "@/services/sipService";

interface AccountManagerProps {
  onAccountSelect?: (account: SIPAccount) => void;
}

export function AccountManager({ onAccountSelect }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SIPAccount | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const storageService = StorageService.getInstance();
  const sipService = SIPService.getInstance();

  const loadAccounts = useCallback(() => {
    const savedAccounts = storageService.getSIPAccounts();
    const activeId = storageService.getActiveAccountId();
    setAccounts(savedAccounts);
    setActiveAccountId(activeId);
  }, [storageService]);

  // Listen for registration status changes
  useEffect(() => {
    const handleStatusChange = (
      accountId: string,
      status: SIPRegistrationStatus
    ) => {
      console.log(`Registration status changed for ${accountId}: ${status}`);

      // Update the specific account in the local state immediately
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) =>
          acc.id === accountId ? { ...acc, registrationStatus: status } : acc
        )
      );

      // Also reload from storage to ensure consistency
      loadAccounts();
    };

    sipService.on("registrationStatusChanged", handleStatusChange);

    return () => {
      sipService.off("registrationStatusChanged", handleStatusChange);
    };
  }, [sipService, loadAccounts]);

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = async (formData: SIPAccountFormData) => {
    setIsLoading(true);
    try {
      const newAccount = storageService.addSIPAccount({
        ...formData,
        isActive: accounts.length === 0, // First account is active by default
        registrationStatus: "unregistered",
      });

      // If this is the first account, make it active
      if (accounts.length === 0) {
        storageService.setActiveAccountId(newAccount.id);
        setActiveAccountId(newAccount.id);
        onAccountSelect?.(newAccount);
      }

      loadAccounts();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add account:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAccount = async (formData: SIPAccountFormData) => {
    if (!editingAccount) return;

    setIsLoading(true);
    try {
      const updatedAccount = storageService.updateSIPAccount(
        editingAccount.id,
        formData
      );
      if (updatedAccount) {
        loadAccounts();
        setEditingAccount(null);
        setIsEditDialogOpen(false); // Close the dialog

        // If this was the active account, notify parent
        if (updatedAccount.id === activeAccountId) {
          onAccountSelect?.(updatedAccount);
        }
      }
    } catch (error) {
      console.error("Failed to update account:", error);
      // TODO: Show error toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    const success = storageService.deleteSIPAccount(accountId);
    if (success) {
      loadAccounts();

      // If the deleted account was active, clear selection
      if (accountId === activeAccountId) {
        setActiveAccountId(null);
        onAccountSelect?.(null as unknown as SIPAccount);
      }
    }
  };

  const handleSetActiveAccount = (account: SIPAccount) => {
    storageService.setActiveAccountId(account.id);
    setActiveAccountId(account.id);
    onAccountSelect?.(account);
  };

  const handleRegisterAccount = async (account: SIPAccount) => {
    console.log(
      `Attempting to register account: ${account.name} (${account.id})`
    );
    try {
      const success = await sipService.registerAccount(account);
      console.log(`Registration result for ${account.name}: ${success}`);
    } catch (error) {
      console.error(`Failed to register account ${account.name}:`, error);
    }
  };

  const handleUnregisterAccount = async (account: SIPAccount) => {
    console.log(
      `Attempting to unregister account: ${account.name} (${account.id})`
    );

    const currentAccount = sipService.getCurrentAccount();
    console.log(
      "Current SIP account:",
      currentAccount?.id,
      currentAccount?.name
    );
    console.log("Account to unregister:", account.id, account.name);
    console.log("Are they the same?", currentAccount?.id === account.id);

    // Check if this account is registered
    if (account.registrationStatus === "registered") {
      try {
        // If SIP service has no current account (e.g., after page reload),
        // just update the status directly
        if (!currentAccount) {
          console.log("No current SIP account, updating status directly");
          storageService.updateSIPAccount(account.id, {
            registrationStatus: "unregistered",
          });
          loadAccounts();
        } else {
          // Normal unregister through SIP service
          await sipService.unregister();
        }
        console.log(`Unregistered account: ${account.name}`);
      } catch (error) {
        console.error(`Failed to unregister account ${account.name}:`, error);
        // Fallback: update status directly if SIP unregister fails
        storageService.updateSIPAccount(account.id, {
          registrationStatus: "unregistered",
        });
        loadAccounts();
      }
    } else {
      console.warn(
        `Cannot unregister ${account.name}: account is not registered`
      );
    }
  };

  const getStatusColor = (status: SIPAccount["registrationStatus"]) => {
    switch (status) {
      case "registered":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "failed":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">SIP Accounts</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogTitle>Add SIP Account</DialogTitle>
            <AccountForm
              onSubmit={handleAddAccount}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={isLoading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>No SIP accounts configured.</p>
              <p className="text-sm mt-1">
                Add your first account to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className={`cursor-pointer transition-all duration-200 ${
                account.id === activeAccountId
                  ? "ring-2 ring-primary bg-muted/50 shadow-md"
                  : "hover:bg-muted/30 hover:shadow-sm"
              }`}
              onClick={() => handleSetActiveAccount(account)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate text-foreground">
                        {account.name}
                      </h3>
                      {account.id === activeAccountId && (
                        <Badge
                          variant="secondary"
                          className="text-xs shrink-0 bg-primary/10 text-primary border-primary/20"
                        >
                          Active
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground truncate font-mono">
                        {account.userId}@{account.server}
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              account.registrationStatus === "registered"
                                ? "bg-green-500 shadow-sm"
                                : account.registrationStatus === "connecting"
                                ? "bg-yellow-500 animate-pulse shadow-sm"
                                : account.registrationStatus === "failed"
                                ? "bg-red-500 shadow-sm"
                                : "bg-gray-400"
                            }`}
                          />
                          <span
                            className={`text-xs font-medium capitalize ${getStatusColor(
                              account.registrationStatus
                            )}`}
                          >
                            {account.registrationStatus}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs">
                            {account.transport}
                          </Badge>
                          {account.port !==
                            DEFAULT_PORTS[account.transport] && (
                            <Badge variant="outline" className="text-xs">
                              :{account.port}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {account.id === activeAccountId && (
                        <div className="flex gap-1 mt-2">
                          {account.registrationStatus === "registered" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnregisterAccount(account);
                              }}
                              className="text-xs h-7 text-red-600 hover:text-red-700 hover:border-red-200"
                            >
                              <LogOut className="w-3 h-3 mr-1" />
                              Disconnect
                            </Button>
                          ) : account.registrationStatus === "connecting" ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              className="text-xs h-7"
                            >
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Connecting...
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRegisterAccount(account);
                              }}
                              className="text-xs h-7 text-green-600 hover:text-green-700 hover:border-green-200"
                            >
                              <LogIn className="w-3 h-3 mr-1" />
                              Connect
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccount(account);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogTitle>
                          {editingAccount ? "Edit SIP Account" : "SIP Account"}
                        </DialogTitle>
                        {editingAccount && (
                          <AccountForm
                            onSubmit={handleEditAccount}
                            onCancel={() => {
                              setEditingAccount(null);
                              setIsEditDialogOpen(false);
                            }}
                            initialData={editingAccount}
                            isLoading={isLoading}
                          />
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete account "${account.name}"?`)) {
                          handleDeleteAccount(account.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
