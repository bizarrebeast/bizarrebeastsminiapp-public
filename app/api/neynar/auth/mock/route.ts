/**
 * Mock Authentication Page for Neynar Free Tier
 * Provides a simple form to enter Farcaster details
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirect = searchParams.get('redirect') || '/rituals';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sign in with Farcaster - Mock Mode</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 24px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .warning {
          background: #fff3cd;
          border: 1px solid #ffc107;
          color: #856404;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          color: #555;
          margin-bottom: 8px;
          font-weight: 500;
        }
        input {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #667eea;
        }
        button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover {
          transform: translateY(-2px);
        }
        .info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          color: #999;
          font-size: 12px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎭 Mock Farcaster Sign In</h1>
        <p class="subtitle">Development Mode - No Real Verification</p>

        <div class="warning">
          ⚠️ This is a mock authentication for testing. To enable real Farcaster authentication, upgrade to a paid Neynar plan.
        </div>

        <form id="authForm">
          <div class="form-group">
            <label for="fid">Farcaster ID (FID)</label>
            <input
              type="number"
              id="fid"
              name="fid"
              placeholder="123456"
              required
              min="1"
            />
          </div>

          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="bizarrebeast"
              required
            />
          </div>

          <div class="form-group">
            <label for="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              placeholder="Bizarre Beast"
              required
            />
          </div>

          <button type="submit">Continue as Mock User</button>
        </form>

        <div class="info">
          This mock authentication stores data locally for testing purposes only.
        </div>
      </div>

      <script>
        document.getElementById('authForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const button = e.target.querySelector('button[type="submit"]');
          const originalText = button.textContent;
          button.textContent = 'Fetching user data...';
          button.disabled = true;

          const formData = new FormData(e.target);
          const fid = formData.get('fid');

          try {
            // Try to fetch real user data from Neynar API
            const response = await fetch('/api/neynar/user/' + fid);

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.user) {
                // Use real user data
                const userData = {
                  ...data.user,
                  mockAuth: false
                };
                localStorage.setItem('neynar_user', JSON.stringify(userData));

                // Auto-fill the form with real data
                document.getElementById('username').value = data.user.username;
                document.getElementById('displayName').value = data.user.displayName;

                setTimeout(() => {
                  const callbackUrl = '/api/neynar/auth/callback?code=mock_' + userData.fid + '&state=${encodeURIComponent(redirect)}';
                  window.location.href = callbackUrl;
                }, 500);
                return;
              }
            }
          } catch (error) {
            console.log('Could not fetch real user data, using provided values');
          }

          // Fallback to manual entry
          const userData = {
            fid: parseInt(formData.get('fid')),
            username: formData.get('username'),
            displayName: formData.get('displayName'),
            mockAuth: true
          };

          localStorage.setItem('neynar_user', JSON.stringify(userData));
          const callbackUrl = '/api/neynar/auth/callback?code=mock_' + userData.fid + '&state=${encodeURIComponent(redirect)}';
          window.location.href = callbackUrl;
        });

        // Auto-fetch user data when FID is entered
        document.getElementById('fid').addEventListener('blur', async (e) => {
          const fid = e.target.value;
          if (!fid) return;

          try {
            const response = await fetch('/api/neynar/user/' + fid);
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.user) {
                document.getElementById('username').value = data.user.username;
                document.getElementById('displayName').value = data.user.displayName;

                // Add a success indicator
                const fidInput = document.getElementById('fid');
                fidInput.style.borderColor = '#10b981';

                // Show a message
                const message = document.createElement('div');
                message.className = 'text-green-600 text-sm mt-1';
                message.textContent = '✓ User found: @' + data.user.username;
                fidInput.parentElement.appendChild(message);

                setTimeout(() => message.remove(), 3000);
              }
            }
          } catch (error) {
            console.log('Could not fetch user data');
          }
        });
      </script>
    </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}