// Base Sepolia Testnet Configuration
export const ATTESTATION_CONFIG_TESTNET = {
  // Base Sepolia Chain ID
  chainId: 84532,

  // Contract will be deployed here
  contractAddress: '0x7dC242881E5a147a14EA99afDb114854Bb1C24e3', // Deployed contract address

  // Base Sepolia RPC URLs
  rpcUrls: [
    'https://sepolia.base.org',
    'https://base-sepolia.public.blastapi.io',
    'https://base-sepolia-rpc.publicnode.com'
  ],

  // Block Explorer
  blockExplorer: 'https://sepolia.basescan.org',

  // Test wallet (already whitelisted)
  testWallet: '0x300a8611D53ca380dA1c556Ca5F8a64D8e1A9dfB',

  // Gas settings for testnet
  gasSettings: {
    maxFeePerGas: '2000000000', // 2 gwei
    maxPriorityFeePerGas: '1000000000', // 1 gwei
    gasLimit: '150000' // Estimated for attestation
  }
};

// Network configuration for wallet connection
export const BASE_SEPOLIA_CONFIG = {
  id: 84532,
  name: 'Base Sepolia',
  network: 'base-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org']
    },
    public: {
      http: ['https://sepolia.base.org']
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://sepolia.basescan.org'
    },
  },
  testnet: true,
};

// Deployment instructions
export const DEPLOYMENT_STEPS = `
Base Sepolia Deployment Steps:
==============================

1. Get testnet ETH:
   - Visit: https://www.alchemy.com/faucets/base-sepolia
   - Enter wallet: 0x300a8611D53ca380dA1c556Ca5F8a64D8e1A9dfB
   - Request 0.1 ETH (enough for multiple tests)

2. Deploy contract using Remix:
   - Open: https://remix.ethereum.org
   - Create new file: BizarreAttestation.sol
   - Paste contract code
   - Compile with Solidity 0.8.20
   - Deploy to "Injected Provider - MetaMask"
   - Switch MetaMask to Base Sepolia
   - Deploy contract
   - Copy deployed address

3. Verify contract:
   - Go to: https://sepolia.basescan.org
   - Find your contract
   - Click "Verify and Publish"
   - Match compiler settings from Remix

4. Update this config:
   - Add contractAddress from step 2
   - Test in the app with TESTNET_MODE = true

5. Test thoroughly:
   - Make attestations with test wallet
   - Check gas costs
   - Test streak functionality
   - Verify leaderboard updates
`;