/**
 * Beta Tester Configuration
 * Two-tier beta system:
 * 1. MY_WALLETS - Dylan's wallets for internal testing
 * 2. COMMUNITY_BETA_TESTERS - Community members for beta testing
 */

// Dylan's wallets - for internal testing
export const MY_WALLETS = [
  '0x300a8611d53ca380da1c556ca5f8a64d8e1a9dfb', // BB's test wallet
  '0xd35da0c9824ce664b106ac5a526221e5fa66f433', // BB's base wallet (unified auth wallet 1)
  '0x3fdd6afed7a19990632468c7102219d051e685db', // BB unified auth wallet 2
  '0x2bfbbc03c3e22903206239e7fd802e6726b19b25', // BB's other wallet
  '0x971a34351b425043d9999e6bc4db6d8671e93fa0', // BB's Rainbow wallet
];

// Community beta testers
export const COMMUNITY_BETA_TESTERS = [
  '0x2a90c5fcc44b5c093c1e3cdb6b1fa09c0e009014', // @siadude (FID: 13975)
  '0xa05d122e807b28e9029df8ae61539579ea517a04', // @degencummunist.eth (FID: 17355)
  '0x593ad7e76d384497201d6dee234d0648000c3bbb', // @dribble (FID: 354835)
  '0x4c356e37b88fb7f98bb11129f7cc772b12d1cf53', // @listen2mm.eth (FID: 215589)
  '0xde63c68e690c6f00e926e66e951c21e9c17c5f91', // @evogsr (FID: 445227)
  '0xb78fe547830c5b83529bc2609a0e1a2948e0a477', // @evogsr.eth (FID: 247437)
  '0xeef52bb58146e98fc088f95b19e0f5c96a92c7f3', // @lisashin (FID: 1318)
  '0x1822f84a526dbd24229e52c5b3849683063ed889', // @jinwoopark (FID: 345863)
  '0xd91bb96b4f2c13c24e48e6fc6de891b02a88d3e9', // @seonghyeon (FID: 413473)
  '0x8c4fd873f04a366c5be844ae9a4ade94d8de2160', // @siablo.eth (FID: 350698)
  '0x7e15bfafbbb635b81ac9c5ff0f00159ba286cb02', // @jiablo.eth (FID: 350037)
  '0xe6edd8a268f1d339a558c83c7a94051a9ab1863a', // @pedronosandrine (FID: 464103)
  '0xfd6e396f9bb37c696afb970b2d6c8f5e37b53f63', // @bbrown (FID: 365651)
  '0xf09bc31983976740a3fb6415c349a2ed27400a09', // @artstudio48 (FID: 424866)
  '0xcd20e491bb20fa95c19c01c88e1a1c826e079c1f', // @heyake (FID: 388327)
  '0xf49f96c12f52ec96cfef965b4a37dc956f37e9e3', // @crezzang (FID: 468287)
  '0xbe1b7f3b088e6b31cbb968cf6db5c3f4bb87a92f', // @kateyarter (FID: 373598)
  '0xab9344bb73c8e0e383c1bb5cfb5cb31faca09e51', // @sausagedad (FID: 410514)
  '0xb09c056b45e8ad1e7fb036c731e056f068f039ac', // @whittanyarter (FID: 373599)
  '0xb10e1fb7f98c956fc88f18f93ba78d45bd067073', // @literalpanther (FID: 3444)
  '0xbda7c7c088a674b5e4dc0b87bb7f86b093a9e99e', // @mustycarlos (FID: 383477)
  '0x2cc2c16e716f096f5b529d6a016e2ff949e2e73a', // @bulgakov-vlad (FID: 871846)
  '0xf15fe868b185fc82ddaffc805ebc37380c778c52', // @dank (FID: 5794)
  '0x908b931fabb953a47cdc3bc4dcecb17b693702b6', // @aim (FID: 11834)
  '0xc77d66286d8832112225de79717fbaac4727a901', // @yerbearserker (FID: 409857)
  '0x49112c36ec09cf0f5ed46bc5fe98115ff32c0234', // @haniz.eth (FID: 411475)
  '0x3c0fefc2ecf4fefcbfdade564821040d2f08d8b9', // @gresha.eth (FID: 425589)
  '0xc608c73f78d1fbb43d5e80622d852c9a39e81f6b', // @kraken8.eth (FID: 333517)
  '0x55dc42476ba60f838f3e1542aff54eda7c3fd005', // @lizajovan (FID: 461597)
  '0x0ae446b27c06a2408dedd3807adaf7996f7d210d', // @itishanna (FID: 992638)
  '0x8f2d6752254fb6d25431b21469aa413a2362954e', // @hairullah (FID: 1042330)
  '0x90d1d211c8d3a94698b8d1b4fa4019add4d81543', // @vanykamur (FID: 480795)
  '0xf238dff611b04e448ac024b54c95ad34f5c90d63', // @i-d0-care (FID: 875987)
  '0x2e1b03a953ce8f6294443f02ad9a87a6dac94958', // @lenonmc21 (FID: 795641)
  '0x47cd9ff80446fdebc4f9b697ea5858cde5ae01f6', // @bitsizzle (FID: 411449)
  '0x34acb0c4a25c49c1b1beddf5a78c9c90b5d85650', // @mrbrick (FID: 999046)
  '0x7c3b6f7863fac4e9d2415b9bd286e22aeb264df4', // @jumpbox.eth (FID: 842363)
];

// Beta phase flags
export const BETA_MY_WALLETS_ACTIVE = true; // Currently: Only Dylan's wallets
export const BETA_COMMUNITY_ACTIVE = true; // Community beta is now LIVE!

/**
 * Check if address is Dylan's wallet
 */
export const isMyWallet = (address: string | null): boolean => {
  if (!address) return false;
  return MY_WALLETS.includes(address.toLowerCase());
};

/**
 * Check if address is a community beta tester
 */
export const isCommunityBetaTester = (address: string | null): boolean => {
  if (!address) return false;
  return COMMUNITY_BETA_TESTERS.includes(address.toLowerCase());
};

/**
 * Check if address has any beta access (based on active flags)
 */
export const isBetaTester = (address: string | null): boolean => {
  if (!address) return false;

  // My wallets always have access when BETA_MY_WALLETS_ACTIVE is true
  if (BETA_MY_WALLETS_ACTIVE && isMyWallet(address)) {
    return true;
  }

  // Community testers have access when BETA_COMMUNITY_ACTIVE is true
  if (BETA_COMMUNITY_ACTIVE && isCommunityBetaTester(address)) {
    return true;
  }

  return false;
};

/**
 * Check if we're in preview mode (community beta active, but user doesn't have access)
 */
export const isPreviewMode = (address: string | null): boolean => {
  // Preview mode is active when community beta is on but user is not a beta tester
  return BETA_COMMUNITY_ACTIVE && !isBetaTester(address);
};

// Legacy compatibility
export const BETA_PHASE_ACTIVE = BETA_MY_WALLETS_ACTIVE || BETA_COMMUNITY_ACTIVE;
export const BETA_TESTERS = [...MY_WALLETS, ...COMMUNITY_BETA_TESTERS];

// Beta tester benefits
export const BETA_BENEFITS = {
  badge: '🧪',
  badgeText: 'Beta Tester',
  bonusMultiplier: 1.1, // 10% bonus rewards during beta
  specialMessage: 'Thank you for being an early supporter!'
};