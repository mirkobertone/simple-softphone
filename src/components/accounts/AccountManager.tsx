import { useState, useEffect, useCallback } from "react";
import { Plus, Settings, Trash2 } from "lucide-react";
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

export function AccountManager() {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SIPAccount | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const storageService = StorageService.getInstance();
  const sipService = SIPService.getInstance();

  const loadAccounts = useCallback(() => {
    const savedAccounts = storageService.getSIPAccounts();
    setAccounts(savedAccounts);
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
      storageService.addSIPAccount({
        ...formData,
        isActive: accounts.length === 0, // First account is active by default
        registrationStatus: "unregistered",
      });

      // If this is the first account, make it active
      if (accounts.length === 0) {
        // Account will be automatically available in the top navigation dropdown
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

        // Account updates will be reflected in the top navigation
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

      // Account deletion will be reflected in the top navigation
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
              className="cursor-pointer transition-all duration-200 hover:bg-muted/30 hover:shadow-sm"
              onClick={() => {
                setEditingAccount(account);
                setIsEditDialogOpen(true);
              }}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate text-foreground">
                        {account.name}
                      </h3>
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
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
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

      {/* Edit Account Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogTitle>Edit SIP Account</DialogTitle>
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
    </div>
  );
}
