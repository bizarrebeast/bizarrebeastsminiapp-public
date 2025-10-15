import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface BlockscoutNFT {
  id: string;
  image_url: string | null;
  animation_url: string | null;
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    animation_url?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    external_url?: string;
  } | null;
  external_app_url?: string;
}

interface BlockscoutResponse {
  items: BlockscoutNFT[];
  next_page_params: any;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractAddress: string }> }
) {
  const { contractAddress } = await params;

  // Validate contract address format
  if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return Response.json(
      { error: 'Invalid contract address' },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching NFT images for contract: ${contractAddress}`);

    // Special handling for BBCP VibeMarket Cards - only fetch specific opened cards
    const isBBCP = contractAddress.toLowerCase() === '0xcebff8f7db53062ade8e3f131a85283131168e59';

    if (isBBCP) {
      const specificTokenIds = [
        '1593', '1537', '1302', '1301', '1266', '1264', '1263',
        '1262', '1260', '1259', '1249', '1248', '1247', '1246',
        '1256', '1206', '909', '855', '837'
      ];

      console.log(`Fetching ${specificTokenIds.length} specific BBCP opened cards`);

      const nftPromises = specificTokenIds.map(async (tokenId) => {
        try {
          const response = await fetch(
            `https://base.blockscout.com/api/v2/tokens/${contractAddress}/instances/${tokenId}`,
            {
              headers: { 'Accept': 'application/json' },
              next: { revalidate: 300 }
            }
          );

          if (response.ok) {
            return await response.json();
          }
          return null;
        } catch (error) {
          console.error(`Failed to fetch token ${tokenId}:`, error);
          return null;
        }
      });

      const allNFTs = (await Promise.all(nftPromises)).filter((nft): nft is BlockscoutNFT => nft !== null);

      const nfts = allNFTs
        .map((item) => ({
          tokenId: item.id,
          name: item.metadata?.name || `Token #${item.id}`,
          description: item.metadata?.description || '',
          image: item.image_url || item.metadata?.image || null,
          animationUrl: item.animation_url || item.metadata?.animation_url || null,
          attributes: item.metadata?.attributes || [],
          externalUrl: item.external_app_url || item.metadata?.external_url || null,
        }))
        .filter((nft) => nft.image !== null);

      console.log(`Successfully fetched ${nfts.length} BBCP opened cards`);

      return Response.json({
        success: true,
        contractAddress,
        count: nfts.length,
        nfts,
      });
    }

    // Default behavior for other collections - fetch all pages of NFTs
    let allNFTs: BlockscoutNFT[] = [];
    let nextPageParams: any = null;
    let pageCount = 0;
    const maxPages = 100; // Safety limit

    do {
      let url = `https://base.blockscout.com/api/v2/tokens/${contractAddress}/instances`;
      if (nextPageParams) {
        const params = new URLSearchParams(nextPageParams);
        url += `?${params}`;
      }

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 5 minutes
        next: { revalidate: 300 }
      });

      if (!response.ok) {
        console.error(`Blockscout API error: ${response.status} ${response.statusText}`);
        return Response.json(
          { error: 'Failed to fetch NFT data from blockchain explorer' },
          { status: response.status }
        );
      }

      const data: BlockscoutResponse = await response.json();
      allNFTs = allNFTs.concat(data.items);
      nextPageParams = data.next_page_params;
      pageCount++;

      console.log(`Fetched page ${pageCount}, got ${data.items.length} items, total: ${allNFTs.length}`);

    } while (nextPageParams && pageCount < maxPages);

    // Transform to our standardized format and filter out NFTs with no images
    const nfts = allNFTs
      .map((item) => ({
        tokenId: item.id,
        name: item.metadata?.name || `Token #${item.id}`,
        description: item.metadata?.description || '',
        // Prefer image_url from API, fallback to metadata.image
        image: item.image_url || item.metadata?.image || null,
        animationUrl: item.animation_url || item.metadata?.animation_url || null,
        attributes: item.metadata?.attributes || [],
        externalUrl: item.external_app_url || item.metadata?.external_url || null,
      }))
      .filter((nft) => nft.image !== null); // Filter out NFTs with no image

    console.log(`Successfully fetched ${allNFTs.length} total NFTs, ${nfts.length} with images for ${contractAddress}`);

    return Response.json({
      success: true,
      contractAddress,
      count: nfts.length,
      nfts,
    });

  } catch (error) {
    console.error('Error fetching NFT images:', error);
    return Response.json(
      {
        error: 'Failed to fetch NFT images',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
