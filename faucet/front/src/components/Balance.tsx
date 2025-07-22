import { UserContext } from "@/App";
import { useContext, useEffect, useState } from "react";

export function Balance() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("UserContext must be used within a UserProvider");
    }
    const { state } = context;
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        const ethereum = window.ethereum;
        if (ethereum == null) { alert("Please install MetaMask"); return; }
        ethereum.request({method: "eth_getBalance", params: [state.account]}).then((balance: string) => {
            setBalance(Number(balance)/10**18);
        });
    }, [state.account]);
    return (
    <div className="space-y-4 mt-5 ml-14">
        <h1 className="text-xl font-bold">Balance</h1>
        <p>Address: {state.account} has: {balance}</p>
    </div>
    );

}