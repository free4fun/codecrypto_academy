import pkg from 'elliptic';
const { ec: EC } = pkg;
import { Wallet, JsonRpcProvider, parseEther, formatEther } from 'ethers';
import { Buffer } from 'buffer';
import keccak256 from 'keccak256';
import fs from 'fs';

async function callApi(url, method, params) {
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            method: method,
            params: params,
            id: 1,
        }),
    });
    const json = await response.json();
    return json;
}

function createKeys(ip) {
    // ETH, BTC, curve
    const ec = new EC('secp256k1');
    // Generate a new key pair
    const keyPair = ec.genKeyPair();
    const privateKey = keyPair.getPrivate('hex');
    const publicKey = keyPair.getPublic('hex');
    // Remove 2 characters from the beginning of the public key with keccak257 (No SHA3)
    const pubKeyBuffer = keccak256(Buffer.from(publicKey.slice(2), 'hex'));
    // Get the last 20 bytes of the public key or 40 characters
    const address = pubKeyBuffer.toString('hex').slice(-40);
    // Get enode
    const enode = `enode://${publicKey.slice(2)}@${ip}:30303`;

    return {
        privateKey,
        publicKey,
        address,
        enode
    }
}

async function getBalance(url, address) {
    const data = await callApi(url, 'eth_getBalance', [address, 'latest']);
    return BigInt(data.result);
}

async function transferFrom(url, from, to, amount) {
    // Create a Wallet from the Private Key
    const wallet = new Wallet(from);
    // Connect the Wallet to the JSON-RPC Provider
    const provider = new JsonRpcProvider(url, {
        chainId: 13371337,
        name: 'private',
    });
    const connectedWallet = wallet.connect(provider);
    // Create and send a Transaction
    const tx = await connectedWallet.sendTransaction({
        to: to,
        value: parseEther(amount.toString())
    });
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    return receipt;
}

async function getNetworkInfo(url) {
    if (!url) {
        url = "http://localhost:8888";
    }
    const version = await callApi("http://localhost:8888", 'net_version', []);
    const peerCount = await callApi("http://localhost:8888", 'net_peerCount', []);
    return {
        version,
        peerCount
    };
}

// Command line handling
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    let url = "http://localhost:8888";

    switch(command) {
        case 'create-keys':
            const ip = args[1];
            if (!ip) {
                console.error('IP address is required for create-keys');
                process.exit(1);
            }
            const keys = createKeys(ip);
            fs.writeFileSync("./key.priv", keys.privateKey);
            fs.writeFileSync("./key.pub", keys.publicKey);
            fs.writeFileSync("./address", keys.address);
            fs.writeFileSync("./enode", keys.enode);
            console.log("Keys created successfully");
            break;
        case 'network-info':
            if (args[1]) {   
                let url = args[1];
            }
            const networkInfo = await getNetworkInfo(url);
            console.log("Network Info: ", networkInfo);
            break;
        case 'balance':
            let address = args[1];
        
            if (args.length > 2) {
                url = args[1];
                address = args[2];
            }
        
            if (!address) {
                console.error('Usage: balance [url] <address>');
                process.exit(1);
            }
        
            try {
                const balance = await getBalance(url, address);
                console.log(`Balance: ${formatEther(balance)} ETH`);
            } catch (error) {
                console.error('Error fetching balance:', error);
                process.exit(1);
            }
            break;
        case 'transfer':
            let from, to, amount;
        
            if (args.length === 5) {
                url = args[1];
                from = args[2];
                to = args[3];
                amount = args[4];
            } else {
                from = args[1];
                to = args[2];
                amount = args[3];
            }
        
            if (!from || !to || !amount) {
                console.error('Usage: transfer [url] <from> <to> <amount>');
                process.exit(1);
            }
        
            try {
                const tx = await transferFrom(url, from, to, amount);
                console.log('Transaction sent:', tx);
            } catch (error) {
                console.error('Error transferring:', error);
                process.exit(1);
            }
            break;
        default:
            console.error('Unknown command:', command);
            console.log('Usage: create-keys <ip> | network-info [url] | balance [url] <address> | transfer [url] <from> <to> <amount>');
            process.exit(1);
            
    }
}
main();