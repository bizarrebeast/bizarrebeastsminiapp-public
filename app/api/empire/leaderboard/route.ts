import { NextResponse } from 'next/server';

const EMPIRE_API_BASE = 'https://www.empirebuilder.world/api';
const BB_TOKEN_ADDRESS = '0x0520bf1d3cEE163407aDA79109333aB1599b4004';

export async function GET() {
  const timeout = 5000; // 5 second timeout
  const retries = 2; // Number of retry attempts

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Fetch from Empire Builder API server-side (no CORS)
      const response = await fetch(`${EMPIRE_API_BASE}/leaderboard/${BB_TOKEN_ADDRESS}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        // Cache for 5 minutes
        next: { revalidate: 300 }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // If client error (4xx), don't retry
        if (response.status >= 400 && response.status < 500) {
          console.warn(`Empire API returned ${response.status} - not retrying`);
          return NextResponse.json(
            { error: 'Empire API unavailable', holders: [], cached: false },
            { status: 200 } // Return 200 to avoid error on frontend
          );
        }
        throw new Error(`Empire API responded with ${response.status}`);
      }

      const data = await response.json();
      return NextResponse.json(data);

    } catch (error: any) {
      // Log the error
      if (error.name === 'AbortError') {
        console.warn(`Empire API timeout (attempt ${attempt + 1}/${retries + 1})`);
      } else if (error.code === 'ENOTFOUND' || error.message?.includes('ENOTFOUND')) {
        console.warn(`Empire API DNS resolution failed (attempt ${attempt + 1}/${retries + 1})`);
      } else {
        console.warn(`Empire API error (attempt ${attempt + 1}/${retries + 1}):`, error.message);
      }

      // If this was the last attempt, return gracefully
      if (attempt === retries) {
        console.error('Empire API failed after all retries');
        return NextResponse.json(
          { error: 'Empire API temporarily unavailable', holders: [], cached: false },
          { status: 200 } // Return 200 to avoid error on frontend
        );
      }

      // Wait a bit before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
    }
  }

  // Fallback (should never reach here)
  return NextResponse.json(
    { error: 'Empire API unavailable', holders: [], cached: false },
    { status: 200 }
  );
}