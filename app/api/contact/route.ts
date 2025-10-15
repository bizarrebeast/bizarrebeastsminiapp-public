import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CATEGORY_LABELS: Record<string, string> = {
  partnership: 'Collabs & Partnerships',
  general: 'General Inquiry',
  feedback: 'Beta Feedback',
  commission: 'Art Commission',
  other: 'Other',
};

// Simple in-memory rate limiting (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // Max 5 submissions
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }

  record.count++;
  return true;
}

// Verify Turnstile token
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // In development, skip verification if no secret key
  if (!secretKey && process.env.NODE_ENV !== 'production') {
    console.warn('Turnstile secret key not set - skipping verification in development');
    return true;
  }

  if (!secretKey) {
    throw new Error('Turnstile secret key not configured');
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Parse FormData instead of JSON
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const contactMethod = formData.get('contactMethod') as string;
    const email = formData.get('email') as string;
    const farcasterHandle = formData.get('farcasterHandle') as string;
    const xHandle = formData.get('xHandle') as string;
    const category = formData.get('category') as string;
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;
    const turnstileToken = formData.get('turnstileToken') as string;
    const image = formData.get('image') as File | null;

    // Basic validation
    if (!name || !category || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    if (!turnstileToken) {
      return NextResponse.json(
        { error: 'Security verification required' },
        { status: 400 }
      );
    }

    const isTurnstileValid = await verifyTurnstile(turnstileToken);
    if (!isTurnstileValid) {
      return NextResponse.json(
        { error: 'Security verification failed. Please try again.' },
        { status: 400 }
      );
    }

    // Validate contact method specific field
    let contactInfo = '';
    if (contactMethod === 'email') {
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      contactInfo = email;
    } else if (contactMethod === 'farcaster') {
      if (!farcasterHandle) {
        return NextResponse.json({ error: 'Farcaster handle is required' }, { status: 400 });
      }
      contactInfo = `@${farcasterHandle.replace('@', '')}`;
    } else if (contactMethod === 'x') {
      if (!xHandle) {
        return NextResponse.json({ error: 'X/Twitter handle is required' }, { status: 400 });
      }
      contactInfo = `@${xHandle.replace('@', '')}`;
    }

    // Rate limiting based on contact info
    if (!checkRateLimit(contactInfo)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Process image if provided
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;
    if (image && image.size > 0) {
      // Validate image size (max 5MB)
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Image must be smaller than 5MB' },
          { status: 400 }
        );
      }

      // Validate image type
      if (!image.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'File must be an image' },
          { status: 400 }
        );
      }

      // Convert to base64
      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');
      imageMimeType = image.type;
    }

    // First, save to database (backup/failsafe)
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        contact_method: contactMethod,
        email: email || null,
        farcaster_handle: farcasterHandle || null,
        x_handle: xHandle || null,
        category,
        subject,
        message,
        image_data: imageBase64,
        image_mime_type: imageMimeType,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save submission' },
        { status: 500 }
      );
    }

    // Now try to send email using Resend
    const categoryLabel = CATEGORY_LABELS[category] || category;

    // Determine contact method label
    let contactMethodLabel = '';
    if (contactMethod === 'email') {
      contactMethodLabel = `Email: ${email}`;
    } else if (contactMethod === 'farcaster') {
      contactMethodLabel = `Farcaster: ${contactInfo}`;
    } else if (contactMethod === 'x') {
      contactMethodLabel = `X/Twitter: ${contactInfo}`;
    }

    // Use test domain in development, production domain in production
    const fromEmail = process.env.NODE_ENV === 'production'
      ? 'BizarreBeasts Contact <contact@bizarrebeasts.io>'
      : 'BizarreBeasts Contact <onboarding@resend.dev>';

    // Test domain can only send to your verified email
    const toEmail = process.env.NODE_ENV === 'production'
      ? ['info@bizarrebeasts.io']
      : ['dylan@bizarrebeasts.io'];

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      replyTo: email || undefined, // Only set if email is provided
      subject: `[${categoryLabel}] ${subject}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #44D0A7 0%, #FFD700 50%, #FF69B4 100%); padding: 30px; text-align: center;">
            <h1 style="color: #000; margin: 0; font-size: 24px;">New Contact Form Submission</h1>
          </div>

          <div style="background: #111; color: #fff; padding: 30px; border: 1px solid #44D0A7;">
            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">Category:</div>
              <div>${categoryLabel}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">From:</div>
              <div>${name}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">Contact:</div>
              <div>${contactMethodLabel}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">Subject:</div>
              <div>${subject}</div>
            </div>

            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">Message:</div>
              <div style="white-space: pre-wrap; background: #000; padding: 15px; border-radius: 8px; border: 1px solid #333;">${message}</div>
            </div>

            ${imageBase64 ? `
            <div style="margin-bottom: 20px;">
              <div style="color: #44D0A7; font-weight: bold; margin-bottom: 5px;">Attached Image:</div>
              <div style="background: #000; padding: 15px; border-radius: 8px; border: 1px solid #333;">
                <img src="data:${imageMimeType};base64,${imageBase64}" alt="Attached image" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </div>
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #888; font-size: 12px;">
              <p>Sent from BizarreBeasts Miniapp Contact Form</p>
              ${contactMethod === 'email' ? `<p>Reply directly to this email to respond to ${name}</p>` : `<p>Contact via ${contactMethodLabel}</p>`}
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      // Update submission with email error
      await supabase
        .from('contact_submissions')
        .update({
          email_sent: false,
          email_error: error.message || 'Failed to send email'
        })
        .eq('id', submission.id);

      // Still return success since we saved to database
      return NextResponse.json(
        { success: true, message: 'Message saved. Email pending domain verification.' },
        { status: 200 }
      );
    }

    // Update submission with email success
    await supabase
      .from('contact_submissions')
      .update({ email_sent: true })
      .eq('id', submission.id);

    return NextResponse.json(
      { success: true, messageId: data?.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
