import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

interface BlockscoutNFT {
  id: string;
  image_url: string | null;
  metadata: {
    name?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  } | null;
}

interface BlockscoutResponse {
  items: BlockscoutNFT[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractAddress: string }> }
) {
  const { contractAddress } = await params;
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  // Validate contract address format
  if (!contractAddress || !contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    return Response.json(
      { error: 'Invalid contract address' },
      { status: 400 }
    );
  }

  try {
    // If specific token ID requested, fetch that specific NFT
    if (tokenId) {
      const response = await fetch(
        `https://base.blockscout.com/api/v2/tokens/${contractAddress}/instances/${tokenId}`,
        {
          headers: {
            'Accept': 'application/json',
          },
          // Cache for 1 hour since cover images don't change often
          next: { revalidate: 3600 }
        }
      );

      if (!response.ok) {
        // If specific token not found, fall back to first token
        console.log(`Token ID ${tokenId} not found, falling back to first token`);
      } else {
        const item: BlockscoutNFT = await response.json();
        const image = item.image_url || item.metadata?.image || null;

        return Response.json({
          success: true,
          contractAddress,
          image,
          tokenId: item.id,
          name: item.metadata?.name || `Token #${item.id}`,
        });
      }
    }

    // Default: fetch first NFT (or first opened card for BBCP)
    const isBBCP = contractAddress.toLowerCase() === '0xcebff8f7db53062ade8e3f131a85283131168e59';
    const itemsToFetch = isBBCP ? 200 : 1; // Fetch more for BBCP to find an opened card

    const response = await fetch(
      `https://base.blockscout.com/api/v2/tokens/${contractAddress}/instances?items_count=${itemsToFetch}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        // Cache for 1 hour since cover images don't change often
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      return Response.json(
        { error: 'Failed to fetch NFT data from blockchain explorer' },
        { status: response.status }
      );
    }

    const data: BlockscoutResponse = await response.json();

    if (data.items.length === 0) {
      return Response.json({
        success: false,
        contractAddress,
        image: null,
      });
    }

    // For BBCP, find first opened card
    let coverItem = data.items[0];
    if (isBBCP) {
      const openedCard = data.items.find(item => {
        const rarityAttr = item.metadata?.attributes?.find(attr => attr.trait_type === 'Rarity');
        return rarityAttr && rarityAttr.value !== 'Unopened';
      });
      if (openedCard) {
        coverItem = openedCard;
      }
    }

    const image = coverItem.image_url || coverItem.metadata?.image || null;

    return Response.json({
      success: true,
      contractAddress,
      image,
      tokenId: coverItem.id,
      name: coverItem.metadata?.name || `Token #${coverItem.id}`,
    });

  } catch (error) {
    console.error('Error fetching cover image:', error);
    return Response.json(
      {
        error: 'Failed to fetch cover image',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
