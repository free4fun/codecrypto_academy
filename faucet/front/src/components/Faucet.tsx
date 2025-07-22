import { UserContext } from "@/App";
import { useContext, useState } from "react";
import { Button } from "./ui/button";
import { Loader2 } from "lucide-react";

export function Faucet() {
    const { state, setState } = useContext(UserContext);
    const [tx, setTx] = useState<object | null >(null);
    const [loading, setLoading] = useState(false);
    async function handleClick() {
        setLoading(true);
        const result = await fetch(`http://localhost:3333/api/faucet/${state.account}/1`);
        const data = await result.json();
        setTx(data);
        setLoading(false);
        
    }
    return <div className="space-y-4 mt-5 ml-14">
        <h1 className="text-xl font-bold">Faucet</h1>
        <p>Account {state.account}</p>
        <Button onClick={async () => handleClick()}>
            {loading && <Loader2 className="w-6 h-6 animate-spin" />} Request Funds
        </Button>
        {tx && <pre>Transaction: {JSON.stringify(tx, null, 4)}</pre>}   
    </div>
}