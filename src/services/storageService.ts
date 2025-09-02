import type { SIPAccount } from "@/types/sip";

const STORAGE_KEYS = {
  SIP_ACCOUNTS: "softphone_sip_accounts",
  ACTIVE_ACCOUNT_ID: "softphone_active_account_id",
} as const;

export class StorageService {
  private static instance: StorageService;

  private constructor() {}

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // SIP Accounts Management
  public getSIPAccounts(): SIPAccount[] {
    try {
      const accounts = localStorage.getItem(STORAGE_KEYS.SIP_ACCOUNTS);
      if (!accounts) return [];

      const parsedAccounts = JSON.parse(accounts);
      // Convert date strings back to Date objects
      return parsedAccounts.map(
        (account: SIPAccount & { createdAt: string; updatedAt: string }) => ({
          ...account,
          createdAt: new Date(account.createdAt),
          updatedAt: new Date(account.updatedAt),
        })
      );
    } catch (error) {
      console.error("Error loading SIP accounts:", error);
      return [];
    }
  }

  public saveSIPAccounts(accounts: SIPAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SIP_ACCOUNTS, JSON.stringify(accounts));
    } catch (error) {
      console.error("Error saving SIP accounts:", error);
      throw new Error("Failed to save SIP accounts");
    }
  }

  public addSIPAccount(
    account: Omit<SIPAccount, "id" | "createdAt" | "updatedAt">
  ): SIPAccount {
    const accounts = this.getSIPAccounts();

    const newAccount: SIPAccount = {
      ...account,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    accounts.push(newAccount);
    this.saveSIPAccounts(accounts);

    return newAccount;
  }

  public updateSIPAccount(
    id: string,
    updates: Partial<SIPAccount>
  ): SIPAccount | null {
    const accounts = this.getSIPAccounts();
    const accountIndex = accounts.findIndex((acc) => acc.id === id);

    if (accountIndex === -1) {
      return null;
    }

    const updatedAccount: SIPAccount = {
      ...accounts[accountIndex],
      ...updates,
      updatedAt: new Date(),
    };

    accounts[accountIndex] = updatedAccount;
    this.saveSIPAccounts(accounts);

    return updatedAccount;
  }

  public deleteSIPAccount(id: string): boolean {
    const accounts = this.getSIPAccounts();
    const filteredAccounts = accounts.filter((acc) => acc.id !== id);

    if (filteredAccounts.length === accounts.length) {
      return false; // Account not found
    }

    this.saveSIPAccounts(filteredAccounts);

    // Clear active account if it was deleted
    if (this.getActiveAccountId() === id) {
      this.setActiveAccountId(null);
    }

    return true;
  }

  // Active Account Management
  public getActiveAccountId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
  }

  public setActiveAccountId(accountId: string | null): void {
    if (accountId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID, accountId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
    }
  }

  public getActiveAccount(): SIPAccount | null {
    const activeId = this.getActiveAccountId();
    if (!activeId) return null;

    const accounts = this.getSIPAccounts();
    return accounts.find((acc) => acc.id === activeId) || null;
  }

  // Utility Methods
  private generateId(): string {
    return `sip_account_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  public clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.SIP_ACCOUNTS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_ACCOUNT_ID);
  }
}
