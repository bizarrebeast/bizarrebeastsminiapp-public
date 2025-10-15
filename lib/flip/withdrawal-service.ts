/**
 * Withdrawal Service - Handles automated token withdrawals
 * Sends ERC20 tokens to users who request withdrawals
 */

import { ethers } from 'ethers';

// ERC20 ABI - only the functions we need
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

interface WithdrawalConfig {
  tokenAddress: string;
  privateKey: string;
  rpcUrl: string;
  chainId: number;
}

interface WithdrawalResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

export class WithdrawalService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private tokenContract: ethers.Contract;
  private config: WithdrawalConfig;

  constructor(config: WithdrawalConfig) {
    this.config = config;

    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);

    // Initialize wallet
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);

    // Initialize token contract
    this.tokenContract = new ethers.Contract(
      config.tokenAddress,
      ERC20_ABI,
      this.wallet
    );
  }

  /**
   * Get current wallet balance
   */
  async getWalletBalance(): Promise<string> {
    try {
      const balance = await this.tokenContract.balanceOf(this.wallet.address);
      return balance.toString();
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw new Error('Failed to fetch wallet balance');
    }
  }

  /**
   * Get wallet ETH balance (for gas)
   */
  async getEthBalance(): Promise<string> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      throw new Error('Failed to fetch ETH balance');
    }
  }

  /**
   * Get token info
   */
  async getTokenInfo(): Promise<{ symbol: string; decimals: number }> {
    try {
      const [symbol, decimals] = await Promise.all([
        this.tokenContract.symbol(),
        this.tokenContract.decimals()
      ]);
      return { symbol, decimals };
    } catch (error) {
      console.error('Error fetching token info:', error);
      throw new Error('Failed to fetch token info');
    }
  }

  /**
   * Estimate gas for withdrawal
   */
  async estimateGas(toAddress: string, amount: string): Promise<bigint> {
    try {
      const gasEstimate = await this.tokenContract.transfer.estimateGas(
        toAddress,
        amount
      );
      // Add 20% buffer
      return (gasEstimate * BigInt(120)) / BigInt(100);
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  /**
   * Process a withdrawal (send tokens to user)
   */
  async processWithdrawal(
    toAddress: string,
    amountWei: string,
    options: {
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<WithdrawalResult> {
    const { maxRetries = 3, retryDelay = 2000 } = options;

    // Validate inputs
    if (!ethers.isAddress(toAddress)) {
      return {
        success: false,
        error: 'Invalid recipient address'
      };
    }

    // Check if amount is valid
    try {
      BigInt(amountWei);
    } catch (err: any) {
      console.error('[WithdrawalService] Invalid amount:', amountWei, 'Error:', err.message);
      return {
        success: false,
        error: `Invalid amount: ${amountWei} (${err.message})`
      };
    }

    // Check wallet has enough tokens
    try {
      const balance = await this.getWalletBalance();
      if (BigInt(balance) < BigInt(amountWei)) {
        return {
          success: false,
          error: `Insufficient token balance. Has: ${balance}, needs: ${amountWei}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check wallet balance'
      };
    }

    // Check wallet has enough ETH for gas
    try {
      const ethBalance = await this.getEthBalance();
      if (parseFloat(ethBalance) < 0.0001) {
        return {
          success: false,
          error: `Insufficient ETH for gas. Balance: ${ethBalance} ETH`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check ETH balance'
      };
    }

    // Attempt withdrawal with retries
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[Withdrawal] Attempt ${attempt + 1}/${maxRetries}`);
        console.log(`[Withdrawal] Sending ${amountWei} tokens to ${toAddress}`);

        // Estimate gas
        const gasLimit = await this.estimateGas(toAddress, amountWei);
        console.log(`[Withdrawal] Estimated gas: ${gasLimit.toString()}`);

        // Get current gas price
        const feeData = await this.provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        console.log(`[Withdrawal] Gas price: ${gasPrice?.toString()} wei`);

        // Send transaction
        const tx = await this.tokenContract.transfer(toAddress, amountWei, {
          gasLimit,
          gasPrice
        });

        console.log(`[Withdrawal] Transaction sent: ${tx.hash}`);
        console.log(`[Withdrawal] Waiting for confirmation...`);

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          console.log(`[Withdrawal] ✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
          return {
            success: true,
            txHash: receipt.hash,
            gasUsed: receipt.gasUsed.toString()
          };
        } else {
          console.error(`[Withdrawal] ❌ Transaction failed`);
          return {
            success: false,
            error: 'Transaction reverted',
            txHash: receipt.hash
          };
        }

      } catch (error: any) {
        console.error(`[Withdrawal] Attempt ${attempt + 1} failed:`, error.message);

        // If this was the last attempt, return error
        if (attempt === maxRetries - 1) {
          return {
            success: false,
            error: error.message || 'Transaction failed after retries'
          };
        }

        // Wait before retrying
        console.log(`[Withdrawal] Retrying in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return {
      success: false,
      error: 'Maximum retries exceeded'
    };
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Format amount from wei to token (for logging)
   */
  async formatAmount(amountWei: string): Promise<string> {
    const { decimals } = await this.getTokenInfo();
    return ethers.formatUnits(amountWei, decimals);
  }
}

/**
 * Create withdrawal service instance
 */
export function createWithdrawalService(): WithdrawalService {
  const tokenAddress = process.env.TEST_TOKEN_ADDRESS || process.env.BB_TOKEN_ADDRESS;
  const privateKey = process.env.WITHDRAWAL_PRIVATE_KEY;
  const rpcUrl = process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
  const chainId = parseInt(process.env.CHAIN_ID || '84532');

  if (!tokenAddress) {
    throw new Error('TOKEN_ADDRESS not configured');
  }

  if (!privateKey) {
    throw new Error('WITHDRAWAL_PRIVATE_KEY not configured');
  }

  return new WithdrawalService({
    tokenAddress,
    privateKey,
    rpcUrl,
    chainId
  });
}
