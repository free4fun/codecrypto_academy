sudo docker run -v ${PWD}/genesis.json:/genesis.json -v ${PWD}/data:/data ethereum/client-go:v1.13.15 init --datadir /data /genesis.json
