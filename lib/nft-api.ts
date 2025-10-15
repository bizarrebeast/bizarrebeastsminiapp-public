/**
 * NFT API utilities for fetching NFT data from blockchain explorers
 */

export interface NFTMetadata {
  tokenId: string;
  name: string;
  description: string;
  image: string | null;
  animationUrl: string | null;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  externalUrl: string | null;
}

export interface NFTCollectionData {
  success: boolean;
  contractAddress: string;
  count: number;
  nfts: NFTMetadata[];
}

/**
 * Fetch all NFTs from a collection contract
 */
export async function fetchCollectionNFTs(
  contractAddress: string
): Promise<NFTCollectionData> {
  try {
    const response = await fetch(`/api/nft/images/${contractAddress}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch NFTs: ${response.statusText}`);
    }

    const data: NFTCollectionData = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching collection ${contractAddress}:`, error);
    throw error;
  }
}

/**
 * Fetch NFTs for multiple collections in parallel
 */
export async function fetchMultipleCollections(
  contractAddresses: string[]
): Promise<Map<string, NFTCollectionData>> {
  const results = await Promise.allSettled(
    contractAddresses.map(address => fetchCollectionNFTs(address))
  );

  const collectionsMap = new Map<string, NFTCollectionData>();

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      collectionsMap.set(contractAddresses[index], result.value);
    } else {
      console.error(
        `Failed to fetch collection ${contractAddresses[index]}:`,
        result.reason
      );
    }
  });

  return collectionsMap;
}

/**
 * Get a single NFT by token ID from a collection
 */
export async function fetchSingleNFT(
  contractAddress: string,
  tokenId: string
): Promise<NFTMetadata | null> {
  try {
    const collectionData = await fetchCollectionNFTs(contractAddress);
    const nft = collectionData.nfts.find(n => n.tokenId === tokenId);
    return nft || null;
  } catch (error) {
    console.error(`Error fetching NFT ${tokenId} from ${contractAddress}:`, error);
    return null;
  }
}

/**
 * Get cover image for a collection (first NFT's image)
 */
export async function getCollectionCoverImage(
  contractAddress: string
): Promise<string | null> {
  try {
    const collectionData = await fetchCollectionNFTs(contractAddress);
    if (collectionData.nfts.length > 0 && collectionData.nfts[0].image) {
      return collectionData.nfts[0].image;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching cover image for ${contractAddress}:`, error);
    return null;
  }
}
