// BizarreAttestation Contract Configuration
export const ATTESTATION_CONTRACT_ADDRESS = '0xdfED9511d9dc546755127E67E50a1B9F4DeA6585';
export const IS_TESTNET = false; // MAINNET ACTIVE!
export const NETWORK_NAME = 'Base';
export const CHAIN_ID = 8453;

// Import ABI
import ATTESTATION_ABI from './attestation-abi.json';
export { ATTESTATION_ABI };

// Re-export configs
export { ATTESTATION_CONFIG_TESTNET } from './attestation-config-testnet';
export { ATTESTATION_CONFIG_MAINNET } from './attestation-config-mainnet';
