import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

// Tier colors
const tierColors: Record<string, string> = {
  diamond: '#b9f2ff',
  platinum: '#e5e5e5',
  gold: '#ffd700',
  silver: '#c0c0c0',
  bronze: '#cd7f32',
  default: '#808080',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Fetch user profile data
    const { data: profile } = await supabaseAdmin
      .from('empire_leaderboard')
      .select(`
        display_name,
        empire_rank,
        empire_tier,
        pfp_url,
        total_shares,
        verified_shares,
        share_points,
        streak_count,
        total_claimed
      `)
      .ilike('display_name', username)
      .single();

    const displayName = profile?.display_name || username;
    const rank = profile?.empire_rank || '—';
    const tier = profile?.empire_tier || 'default';
    const tierColor = tierColors[tier.toLowerCase()] || tierColors.default;
    const pfpUrl = profile?.pfp_url;
    const streakCount = profile?.streak_count || 0;
    const totalClaimed = profile?.total_claimed || 0;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
            backgroundImage: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(138, 43, 226, 0.15) 0%, transparent 50%)',
              display: 'flex',
            }}
          />

          {/* Logo Header */}
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: 50,
              display: 'flex',
              alignItems: 'center',
              gap: 15,
            }}
          >
            <div
              style={{
                fontSize: 50,
                display: 'flex',
              }}
            >
              👹
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 'bold',
                color: 'white',
                display: 'flex',
              }}
            >
              BizarreBeasts
            </div>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            {/* Profile Picture */}
            {pfpUrl && (
              <img
                src={pfpUrl}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 75,
                  border: `4px solid ${tierColor}`,
                  marginBottom: 20,
                }}
              />
            )}

            {/* Username */}
            <div
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: 'white',
                marginBottom: 10,
                display: 'flex',
              }}
            >
              {displayName}
            </div>

            {/* Rank and Tier */}
            <div
              style={{
                display: 'flex',
                gap: 30,
                alignItems: 'center',
                marginBottom: 30,
              }}
            >
              {rank !== '—' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      color: '#808080',
                      display: 'flex',
                    }}
                  >
                    RANK
                  </div>
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 'bold',
                      color: tierColor,
                      display: 'flex',
                    }}
                  >
                    #{rank}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    color: '#808080',
                    display: 'flex',
                  }}
                >
                  TIER
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 'bold',
                    color: tierColor,
                    textTransform: 'uppercase',
                    display: 'flex',
                  }}
                >
                  {tier}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'flex',
                gap: 50,
                marginTop: 20,
              }}
            >
              {streakCount > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {streakCount}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: '#808080',
                      display: 'flex',
                    }}
                  >
                    DAY STREAK
                  </div>
                </div>
              )}

              {totalClaimed > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 'bold',
                      color: 'white',
                      display: 'flex',
                    }}
                  >
                    {totalClaimed.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      color: '#808080',
                      display: 'flex',
                    }}
                  >
                    $BB EARNED
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: '#808080',
                display: 'flex',
              }}
            >
              bbapp.bizarrebeasts.io
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'black',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          👹 BizarreBeasts
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}