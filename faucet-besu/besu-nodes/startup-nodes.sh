# Delete Networks
rm -rf networks
docker rm -f $(docker ps  -aq --filter "label=network=besu-network") 2>/dev/null || true # true is used to ignore the error if no container is found
docker network rm besu-network 2>/dev/null || true # true is used to ignore the error if no network is found

# Set Configuration
NETWORK="172.24.0.0/16"
BOOTNODE_IP="172.24.0.20"

# Create directories
mkdir -p networks/besu-network/bootnode

# Create Docker Network
docker network create besu-network --subnet $NETWORK --label network=besu-network --label type=besu

# Create Private and Public keys and Addresss
cd networks/besu-network/bootnode
node ../../../index.mjs create-keys ${BOOTNODE_IP}
cd ../../..

# Create Genesis File with Clique PoA configuration
cat > networks/besu-network/genesis.json << EOF
{
    "config": {
        "chainId": 13371337,
        "londonBlock": 0,
        "clique": {
        "blockperiodseconds": 4,
        "epochlength": 30000,
        "createemptyblocks": true
        }
    },
    "extraData": "0x0000000000000000000000000000000000000000000000000000000000000000$(cat networks/besu-network/bootnode/address)0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
    "gasLimit": "0x1fffffffffffff",
    "difficulty": "0x1",
    "alloc": {
        "$(cat networks/besu-network/bootnode/address)": {
        "balance": "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
        }
    }
}
EOF

# Create Configuration file for Besu node
cat > networks/besu-network/config.toml << EOF
genesis-file="/data/genesis.json"
#Networking
p2p-host="0.0.0.0"
p2p-port=30303
p2p-enabled=true

#JSON-RPC
rpc-http-enabled=true
rpc-http-host="0.0.0.0"
rpc-http-port=8545
rpc-http-cors-origins=["*"]
rpc-http-api=["ETH","NET","CLIQUE", "WEB3", "ADMIN","TRACE","DEBUG","TXPOOL","PERM"]
host-allowlist=["*"]
EOF

# Launch Besu Node
docker run -d \
    --name besu-network-bootnode \
    --label node=bootnode \
    --label network=besu-network \
    --ip ${BOOTNODE_IP} \
    --network besu-network \
    -p 8888:8545 \
    -v $(pwd)/networks/besu-network:/data \
    hyperledger/besu:latest \
    --data-path=/data/bootnode/data \
    --config-file=/data/config.toml \
    --node-private-key-file=/data/bootnode/key.priv \
    --genesis-file=/data/genesis.json

# Create Keys for test in current directory
node ./index.mjs create-keys 192.168.1.100

# Wait for Besu to be ready
echo "Waiting for Besu JSON-RPC to be available at http://localhost:8888..."
until curl -s http://localhost:8888 -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"web3_clientVersion","params":[],"id":1}' | grep -q "result"; do
  sleep 1
done
echo "Besu is ready!"


# Check Balance
node index.mjs balance $(cat networks/besu-network/bootnode/address)

# Transfer 10000 to 0x${cat address}
node index.mjs transfer 0x$(cat networks/besu-network/bootnode/key.priv) 0x$(cat address) 10000

# Check Balance
node index.mjs balance 0x$(cat address)