import { NextRequest, NextResponse } from 'next/server';

// We'll use a global store for now (in production, use Redis or a database)
const getImageStore = () => {
  if (!global.imageStore) {
    global.imageStore = new Map();
  }
  return global.imageStore;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const imageStore = getImageStore();
    const image = imageStore.get(params.id);

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found or expired' },
        { status: 404 }
      );
    }

    // Check if expired
    if (image.expires < Date.now()) {
      imageStore.delete(params.id);
      return NextResponse.json(
        { error: 'Image expired' },
        { status: 404 }
      );
    }

    // Parse the data URL
    const matches = image.data.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      );
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Image retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve image' },
      { status: 500 }
    );
  }
}