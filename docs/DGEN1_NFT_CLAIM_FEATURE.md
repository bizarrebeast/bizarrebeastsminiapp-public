# dGEN1 NFT Claim Feature Documentation

## Overview
Feature to allow dGEN1 NFT holders to claim exclusive artwork NFTs through the Bizarre Beasts miniapp.

## Key Information

### dGEN1 NFT Contract
- **Contract Address**: `0x7533e410ed2780807488b0068399788b2932b4e1`
- **Network**: Base Mainnet
- **Type**: ERC-721 NFT
- **Current Holders**: 5,440+
- **BaseScan**: https://basescan.org/token/0x7533e410ed2780807488b0068399788b2932b4e1

### Requirements
- **Eligibility**: Must own dGEN1 NFT (original or burned/claimed version)
- **Claim Limit**: 1 artwork NFT per wallet
- **Gas Fees**: Paid by user
- **Artwork NFTs**: To be minted (not yet deployed)

## Recommended Implementation: Signature-Based Lazy Minting

### Architecture Overview
```
User Flow:
1. Connect wallet (auto-detect dGEN1)
2. Request claim → Backend verifies
3. Receive signed voucher
4. Submit to contract (pay gas)
5. NFT minted to wallet
```

### Smart Contract Requirements
```solidity
contract ArtworkClaim {
    mapping(address => bool) public hasClaimed;
    address public signer;

    function claimWithSignature(
        bytes memory signature,
        uint256 deadline
    ) external {
        require(!hasClaimed[msg.sender], "Already claimed");
        require(block.timestamp <= deadline, "Expired");
        require(verifySignature(msg.sender, deadline, signature), "Invalid");

        hasClaimed[msg.sender] = true;
        _mint(msg.sender, nextTokenId++);
    }
}
```

### Backend Implementation

#### 1. dGEN1 Detection Service (`/lib/dgen1Service.ts`)
```typescript
// Check NFT ownership
async function checkDgen1Ownership(address: string): Promise<boolean> {
  const DGEN1_ADDRESS = '0x7533e410ed2780807488b0068399788b2932b4e1';
  const balance = await nftContract.balanceOf(address);
  return balance > 0;
}

// Detect dGEN1 browser/device
function detectDgen1Browser(): boolean {
  const ua = navigator.userAgent;
  return ua.includes('ethOS') || ua.includes('dGEN1');
}
```

#### 2. Claim API Route (`/api/claim-nft/route.ts`)
```typescript
async function POST(req: Request) {
  const { address, signature } = await req.json();

  // Verify signature
  const recovered = verifySignature(message, signature);
  if (recovered !== address) throw Error('Invalid signature');

  // Check dGEN1 ownership
  if (!await checkDgen1Ownership(address)) {
    throw Error('Must own dGEN1 NFT');
  }

  // Check claim history
  const claimed = await supabase
    .from('nft_claims')
    .select('*')
    .eq('wallet_address', address);
  if (claimed.data?.length) throw Error('Already claimed');

  // Generate claim voucher
  const deadline = Date.now() + 86400000; // 24 hours
  const signature = await signClaim(address, deadline);

  // Record pending claim
  await supabase.from('nft_claims').insert({
    wallet_address: address,
    status: 'pending',
    voucher_deadline: deadline
  });

  return { signature, deadline };
}
```

### Frontend Implementation

#### 1. Claim Page (`/app/claim/page.tsx`)
```typescript
function ClaimPage() {
  const { address, isConnected } = useWallet();
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    if (address) {
      checkEligibility(address).then(setEligibility);
    }
  }, [address]);

  if (!isConnected) return <WalletConnectPrompt />;
  if (!eligibility?.isDgen1Holder) return <NotEligible />;
  if (eligibility?.hasClaimed) return <AlreadyClaimed />;

  return <ClaimInterface />;
}
```

#### 2. Auto-Detection Hook
```typescript
// Automatically check on wallet connect
useEffect(() => {
  if (address) {
    checkDgen1Ownership(address).then(isDgen1 => {
      if (isDgen1) {
        // Show claim notification
        showClaimNotification();
      }
    });
  }
}, [address]);
```

### Database Schema (Supabase)
```sql
CREATE TABLE nft_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT UNIQUE NOT NULL,
  token_id INTEGER,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  voucher_deadline TIMESTAMP,
  claimed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Implementation Checklist

### Phase 1: Backend Setup
- [ ] Create dGEN1 detection service
- [ ] Implement NFT balance checking
- [ ] Set up claim API endpoint
- [ ] Add Supabase table for claims
- [ ] Implement signature generation

### Phase 2: Smart Contract
- [ ] Write claim contract
- [ ] Add signature verification
- [ ] Deploy to Base testnet
- [ ] Test claim flow
- [ ] Deploy to Base mainnet

### Phase 3: Frontend
- [ ] Create claim page UI
- [ ] Add wallet connection flow
- [ ] Implement auto-detection
- [ ] Add claim status tracking
- [ ] Success/error handling

### Phase 4: Testing & Launch
- [ ] Test with testnet NFTs
- [ ] Security audit
- [ ] Gas optimization
- [ ] Launch announcement
- [ ] Monitor claims

## Security Considerations
1. **Signature Verification**: Prevent claim spoofing
2. **Rate Limiting**: Prevent spam on API
3. **Duplicate Prevention**: Database constraint on wallet_address
4. **Time Limits**: 24-hour voucher expiration
5. **On-chain Verification**: Contract double-checks ownership

## Cost Analysis
- **User Gas Cost**: ~$2-5 per claim on Base
- **Backend Costs**: Minimal (API calls, database)
- **Contract Deployment**: ~$20-50 one-time

## Alternative Approaches Considered

### Option A: Direct Transfer
- Pre-mint all NFTs
- Backend transfers to users
- Pros: Simple
- Cons: High upfront cost, you pay gas

### Option B: Merkle Tree Allowlist
- Snapshot dGEN1 holders
- Deploy with merkle root
- Pros: Fully decentralized
- Cons: Less flexible, can't update easily

### Option C: Simple Claim Contract
- Users claim directly
- No backend needed
- Pros: Simplest
- Cons: No control over eligibility

## Next Steps
1. Deploy smart contract
2. Implement backend verification
3. Build claim UI
4. Test end-to-end flow
5. Launch to dGEN1 community

## Resources
- [dGEN1 Documentation](https://docs.freedomfactory.io/)
- [Base Network Docs](https://docs.base.org/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Reown AppKit Docs](https://docs.reown.com/)

## Contact Points
- Feature Owner: Dylan
- Implementation: Claude Code Assistant
- Timeline: TBD

---
*Last Updated: [Current Date]*
*Status: Planning Phase*