import { useEffect, useState } from "react";
import { SIPService, type SIPRegistrationStatus } from "@/services/sipService";
import type { SIPAccount } from "@/types/sip";

export function useSIP() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<SIPAccount | null>(null);

  const sipService = SIPService.getInstance();

  useEffect(() => {
    const handleStatusChange = (
      accountId: string,
      status: SIPRegistrationStatus
    ) => {
      setIsRegistered(status === "registered");
      setCurrentAccount(sipService.getCurrentAccount());
    };

    sipService.on("registrationStatusChanged", handleStatusChange);

    // Initialize state
    setIsRegistered(sipService.isRegistered());
    setIsConnected(sipService.isConnected());
    setCurrentAccount(sipService.getCurrentAccount());

    return () => {
      sipService.off("registrationStatusChanged");
    };
  }, [sipService]);

  const registerAccount = async (account: SIPAccount) => {
    return await sipService.registerAccount(account);
  };

  const unregister = async () => {
    await sipService.unregister();
  };

  const disconnect = async () => {
    await sipService.disconnect();
  };

  const makeCall = (target: string, options?: any) => {
    return sipService.makeCall(target, options);
  };

  return {
    isRegistered,
    isConnected,
    currentAccount,
    registerAccount,
    unregister,
    disconnect,
    makeCall,
    sipService,
  };
}
