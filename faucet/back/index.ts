import express from 'express';
import type { Request, Response } from 'express';
import { ethers } from 'ethers';
import  fs  from 'fs';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
const app = express();
const port = process.env.BACKEND_PORT;
app.use(express.json());
app.use(cors());



// Balance Ethers
app.get('/api/balanceEthers/:address', async (req: Request, res: Response) => {
    const address = req.params.address;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const balance = await provider.getBalance(address);
    res.json({ address, balance: Number(balance) /10**18, date: new Date().toISOString() });
});

// Faucet
app.get('/api/faucet/:address/:amount', async (req: Request, res: Response) => {
    const { address, amount } = req.params;
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const route = process.env.KEYSTORE_FILE;
    if (!route) {
        res.status(500).json({ error: "KEYSTORE_FILE is not defined" });
        return;
    }
    const routeData = fs.readFileSync(route, "utf-8");
    const rpcPwd = process.env.RPC_PWD;
    if (!rpcPwd) {
        res.status(500).json({ error: "RPC_PWD is not defined" });
        return;
    }
    const wallet = await ethers.Wallet.fromEncryptedJson(routeData, rpcPwd);
    const walletConnected = wallet.connect(provider);
    const tx = await walletConnected.sendTransaction({ to : address, value: ethers.parseEther(amount) });
    await tx.wait();
    res.json({ address, amount, date: new Date().toISOString() });
});


// Balance
app.get('/api/balance/:address', async (req: Request, res: Response) => {
    const address = req.params.address;
    const rpcUrl = process.env.RPC_URL;
    if (!rpcUrl) {
        res.status(500).json({ error: "RPC_URL is not defined" });
        return;
    }
    const ret = await fetch(rpcUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "eth_getBalance", params: [address, "latest"], id: 1 })
    })
    const data: any  = await ret.json();
    res.json( { address, balance: Number(data.result)/10**18, date: new Date().toISOString()} );
}
);

// Health check endpoint
app.get('/api/isAlive', async (req: Request, res: Response) => {
    try {
        const response = await axios.post(process.env.RPC_URL || "", {
            jsonrpc: "2.0",
            method: "web3_clientVersion",
            params: [],
            id: 1
        });
        if (response.data && response.data.result) {
            res.json({ alive: true });
        } else {
            res.json({ alive: false });
        }
    } catch (error) {
        console.error("Health check failed:", error);
        res.json({ alive: false });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});