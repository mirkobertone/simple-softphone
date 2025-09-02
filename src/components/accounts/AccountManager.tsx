import { useState, useEffect } from "react";
import { Plus, Settings, Trash2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AccountForm } from "./AccountForm";
import type { SIPAccount, SIPAccountFormData } from "@/types/sip";
import { StorageService } from "@/services/storageService";

interface AccountManagerProps {
  onAccountSelect?: (account: SIPAccount) => void;
}

export function AccountManager({ onAccountSelect }: AccountManagerProps) {
  const [accounts, setAccounts] = useState<SIPAccount[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SIPAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const storageService = StorageService.getInstance();

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const savedAccounts = storageService.getSIPAccounts();
    const activeId = storageService.getActiveAccountId();
    setAccounts(savedAccounts);
    setActiveAccountId(activeId);
  };

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
        onAccountSelect?.(null as any);
      }
    }
  };

  const handleSetActiveAccount = (account: SIPAccount) => {
    storageService.setActiveAccountId(account.id);
    setActiveAccountId(account.id);
    onAccountSelect?.(account);
  };

  const getStatusBadgeVariant = (status: SIPAccount["registrationStatus"]) => {
    switch (status) {
      case "registered":
        return "default";
      case "connecting":
        return "secondary";
      case "failed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: SIPAccount["registrationStatus"]) => {
    switch (status) {
      case "registered":
        return <Power className="w-3 h-3" />;
      case "connecting":
        return <Power className="w-3 h-3 animate-pulse" />;
      default:
        return <PowerOff className="w-3 h-3" />;
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
            <DialogHeader>
              <DialogTitle>Add SIP Account</DialogTitle>
            </DialogHeader>
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
              className={`cursor-pointer transition-colors ${
                account.id === activeAccountId
                  ? "ring-2 ring-primary bg-muted/50"
                  : "hover:bg-muted/30"
              }`}
              onClick={() => handleSetActiveAccount(account)}
            >
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{account.name}</h3>
                      {account.id === activeAccountId && (
                        <Badge variant="secondary" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {account.userId}@{account.server}:{account.port}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={getStatusBadgeVariant(
                          account.registrationStatus
                        )}
                        className="text-xs"
                      >
                        {getStatusIcon(account.registrationStatus)}
                        <span className="ml-1 capitalize">
                          {account.registrationStatus}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {account.transport}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingAccount(account);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit SIP Account</DialogTitle>
                        </DialogHeader>
                        {editingAccount && (
                          <AccountForm
                            onSubmit={handleEditAccount}
                            onCancel={() => setEditingAccount(null)}
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
