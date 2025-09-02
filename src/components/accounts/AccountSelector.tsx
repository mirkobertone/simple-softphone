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

  return (
    <div className="flex items-center gap-2">
      <Select value={activeAccountId || ""} onValueChange={onAccountChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          {accounts.map((account) => (
            <SelectItem key={account.id} value={account.id}>
              <div className="flex items-center justify-between w-full">
                <span>{account.name}</span>
                <Badge
                  variant={
                    account.registrationStatus === "registered"
                      ? "default"
                      : account.registrationStatus === "connecting"
                      ? "secondary"
                      : account.registrationStatus === "failed"
                      ? "destructive"
                      : "outline"
                  }
                  className="text-xs ml-2"
                >
                  {account.registrationStatus}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
