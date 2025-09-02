import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { SIPAccount } from "@/types/sip";

interface AccountSelectorProps {
  accounts: SIPAccount[];
  activeAccountId: string | null;
  onAccountChange: (accountId: string) => void;
}

export function AccountSelector({
  accounts,
  activeAccountId,
  onAccountChange,
}: AccountSelectorProps) {
  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No accounts configured
      </div>
    );
  }

  const activeAccount = accounts.find((acc) => acc.id === activeAccountId);

  return (
    <div className="flex items-center gap-2">
      <Select value={activeAccountId || ""} onValueChange={onAccountChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center gap-2">
                <span>{account.name}</span>
                <Badge
                  variant={
                    account.registrationStatus === "registered"
                      ? "default"
                      : "secondary"
                  }
                  className="text-xs"
                >
                  {account.registrationStatus}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeAccount && (
        <Badge
          variant={
            activeAccount.registrationStatus === "registered"
              ? "default"
              : "secondary"
          }
        >
          {activeAccount.registrationStatus}
        </Badge>
      )}
    </div>
  );
}
