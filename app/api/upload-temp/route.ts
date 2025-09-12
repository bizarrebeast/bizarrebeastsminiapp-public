import { NextRequest, NextResponse } from 'next/server';

// Use global store to share between routes
declare global {
  var imageStore: Map<string, { data: string; expires: number }> | undefined;
}

const getImageStore = () => {
  if (!global.imageStore) {
    global.imageStore = new Map();
  }
  return global.imageStore;
};

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData || !imageData.startsWith('data:image')) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const imageId = Math.random().toString(36).substring(7) + Date.now().toString(36);
    
    // Store image for 1 hour
    const imageStore = getImageStore();
    imageStore.set(imageId, {
      data: imageData,
      expires: Date.now() + 60 * 60 * 1000,
    });

    // Return the URL to access the image
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (request.headers.get('host')?.includes('localhost') 
                     ? `http://${request.headers.get('host')}` 
                     : `https://${request.headers.get('host')}`);
    
    const imageUrl = `${baseUrl}/api/image/${imageId}`;

    // Return both id and imageUrl for backward compatibility
    // MemeCanvas expects 'id' for downloads and 'imageUrl' for shares
    return NextResponse.json({ 
      success: true,
      imageUrl,
      id: imageId, // Add 'id' field for download compatibility
      imageId,
      expiresIn: '1 hour'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}