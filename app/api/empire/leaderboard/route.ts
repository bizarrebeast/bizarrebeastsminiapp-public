import { NextResponse } from 'next/server';

const EMPIRE_API_BASE = 'https://www.empirebuilder.world/api';
const BB_TOKEN_ADDRESS = '0x0520bf1d3cEE163407aDA79109333aB1599b4004';

export async function GET() {
  try {
    // Fetch from Empire Builder API server-side (no CORS)
    const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Empire API responded with ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Empire leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard', holders: [], cached: false },
      { status: 500 }
    );
  }
}