// Contract configuration for BizarreAttestation

// Contract addresses (update these after deployment)
export const ATTESTATION_CONTRACT_ADDRESS = {
  // Base Sepolia (testnet)
  baseSepolia: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment

  // Base Mainnet
  base: '0x0000000000000000000000000000000000000000', // TODO: Update after deployment
};

// Get contract address based on environment
export const getAttestationContractAddress = (): string => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID || '84532'; // Default to Base Sepolia

  switch (chainId) {
    case '8453': // Base Mainnet
      return ATTESTATION_CONTRACT_ADDRESS.base;
    case '84532': // Base Sepolia
      return ATTESTATION_CONTRACT_ADDRESS.baseSepolia;
    default:
      return ATTESTATION_CONTRACT_ADDRESS.baseSepolia;
  }
};

// Contract deployment instructions
export const DEPLOYMENT_INSTRUCTIONS = `
  To deploy the BizarreAttestation contract:

  1. Install dependencies:
     npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

  2. Create hardhat.config.js:
     module.exports = {
       solidity: "0.8.20",
       networks: {
         baseSepolia: {
           url: process.env.BASE_SEPOLIA_RPC_URL,
           accounts: [process.env.PRIVATE_KEY]
         },
         base: {
           url: process.env.BASE_RPC_URL,
           accounts: [process.env.PRIVATE_KEY]
         }
       }
     };

  3. Deploy script (scripts/deploy.js):
     async function main() {
       const BizarreAttestation = await ethers.getContractFactory("BizarreAttestation");
       const contract = await BizarreAttestation.deploy();
       await contract.deployed();
       console.log("BizarreAttestation deployed to:", contract.address);
     }
     main().catch((error) => {
       console.error(error);
       process.exitCode = 1;
     });

  4. Deploy to Base Sepolia:
     npx hardhat run scripts/deploy.js --network baseSepolia

  5. Verify on BaseScan:
     npx hardhat verify --network baseSepolia DEPLOYED_CONTRACT_ADDRESS

  6. Update this file with the deployed contract address
`;

// Export ABI
export { default as ATTESTATION_ABI } from './attestation-abi.json';