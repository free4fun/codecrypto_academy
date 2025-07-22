import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useContext, useEffect } from "react";
import { UserContext } from "@/App";
import { NodeStatus } from "@/components/NodeStatus";

export function Header() {
  const { state, setState } = useContext(UserContext);
  useEffect(() => {
    const ethereum = (window as any).ethereum;
    if (ethereum == null) { alert("Please install MetaMask"); return; }
    ethereum.request({ method: "eth_requestAccounts" }).then((account: string[]) => {
      setState({ account: account[0] });
    });
    ethereum.on("accountsChanged", function (account: string[]) {
      setState({ account: account[0] });
    });
  });

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <div className="flex gap-2 justify-center pt-4">
        <Link to="/home"><Button>Home</Button></Link>
        <Link to="/faucet"><Button>Faucet</Button></Link>
        <Link to="/balance"><Button>Balance</Button></Link>
        <Link to="/transfer"><Button>Transfer</Button></Link>
        <div className="flex gap-2 justify-center pt-2 pl-12">{ state.account ? `Account Address: ${state.account}` : "Account Not Selected" }</div>
      </div>
      <NodeStatus />
    </header>
  );
}