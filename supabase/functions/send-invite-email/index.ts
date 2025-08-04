import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface InviteEmailRequest {
  to: string;
  firstName: string;
  lastName: string;
  householdName: string;
  inviteCode: string;
  role: string;
  invitedBy: string;
}

interface ResendEmailRequest {
  from: string;
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req: Request) => {
  console.log('=== RESEND EMAIL FUNCTION STARTED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
      },
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Get the request body
    const body: InviteEmailRequest = await req.json();
    console.log('=== REQUEST BODY ===');
    console.log('To:', body.to);
    console.log('FirstName:', body.firstName);
    console.log('LastName:', body.lastName);
    console.log('HouseholdName:', body.householdName);
    console.log('InviteCode:', body.inviteCode);
    console.log('Role:', body.role);
    console.log('InvitedBy:', body.invitedBy);
    
    // Validate required fields
    console.log('=== VALIDATING FIELDS ===');
    console.log('Has email:', !!body.to);
    console.log('Has firstName:', !!body.firstName);
    console.log('Has householdName:', !!body.householdName);
    console.log('Has inviteCode:', !!body.inviteCode);
    
    if (!body.to || !body.firstName || !body.householdName || !body.inviteCode) {
      console.log('❌ VALIDATION FAILED - Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    console.log('✅ VALIDATION PASSED');

    // Get Resend API key from environment
    console.log('=== CHECKING RESEND API KEY ===');
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('❌ RESEND API KEY NOT FOUND');
      return new Response(JSON.stringify({ error: 'Resend API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    console.log('✅ RESEND API KEY FOUND (length:', resendApiKey.length, ')');

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to HomeBuddy!</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background-color: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 32px;
            margin-bottom: 10px;
          }
          .title {
            color: #2563eb;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .invite-code-section {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .invite-code {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 4px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
          }
          .expiry-note {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 15px;
          }
          .steps {
            background-color: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .steps ol {
            margin: 0;
            padding-left: 20px;
          }
          .steps li {
            margin-bottom: 10px;
            color: #374151;
          }
          .role-badge {
            display: inline-block;
            background-color: #10b981;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            text-transform: capitalize;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏠</div>
            <h1 class="title">Welcome to HomeBuddy!</h1>
            <p class="subtitle">The family organization app that makes home life easier</p>
          </div>

          <p>Hi ${body.firstName},</p>
          
          <p>You've been invited to join <strong>${body.householdName}</strong> on HomeBuddy! 🎉</p>
          
          <div class="invite-code-section">
            <h3 style="margin-top: 0; margin-bottom: 15px;">Your Invite Code</h3>
            <div class="invite-code">${body.inviteCode}</div>
            <p class="expiry-note">This code expires in 30 days</p>
          </div>

          <p><strong>Your role:</strong> <span class="role-badge">${body.role}</span></p>

          <div class="steps">
            <h3 style="margin-top: 0; color: #374151;">To get started:</h3>
            <ol>
              <li>Download HomeBuddy from the App Store or Google Play</li>
              <li>Sign up with your email address</li>
              <li>Enter the invite code above when prompted</li>
              <li>Start organizing your family life together!</li>
            </ol>
          </div>

          <p>If you have any questions, just reply to this email.</p>
          
          <p>Welcome to the family! 🏠</p>

          <div class="footer">
            <p>This invite was sent by ${body.invitedBy} from ${body.householdName}.</p>
            <p>© 2024 HomeBuddy. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare email data for Resend
    console.log('=== PREPARING EMAIL DATA ===');
    const emailData: ResendEmailRequest = {
      from: 'HomeBuddy <hello@homebuddy.nz>',
      to: body.to,
      subject: `You're invited to join ${body.householdName} on HomeBuddy!`,
      html: emailHtml,
    };
    console.log('Email From:', emailData.from);
    console.log('Email To:', emailData.to);
    console.log('Email Subject:', emailData.subject);
    console.log('Email HTML Length:', emailData.html.length, 'characters');

    // Send email via Resend API
    console.log('=== SENDING EMAIL VIA RESEND ===');
    console.log('Resend API URL: https://api.resend.com/emails');
    console.log('Request headers:', {
      'Authorization': `Bearer ${resendApiKey.substring(0, 10)}...`,
      'Content-Type': 'application/json',
    });
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    console.log('Resend Response Status:', resendResponse.status);
    console.log('Resend Response Headers:', Object.fromEntries(resendResponse.headers.entries()));

    if (!resendResponse.ok) {
      console.log('❌ RESEND API ERROR');
      console.log('Response status:', resendResponse.status);
      console.log('Response status text:', resendResponse.statusText);
      
      let errorData;
      try {
        errorData = await resendResponse.json();
      } catch (e) {
        errorData = { error: 'Could not parse error response' };
      }
      console.error('Resend API error details:', errorData);
      
      return new Response(JSON.stringify({ 
        error: 'Failed to send email',
        details: errorData,
        status: resendResponse.status,
        statusText: resendResponse.statusText
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    console.log('✅ RESEND API SUCCESS');
    const result = await resendResponse.json();
    console.log('Resend Response Body:', result);
    console.log('Message ID:', result.id);

    console.log('=== EMAIL SENT SUCCESSFULLY ===');
    console.log('To:', body.to);
    console.log('Subject:', emailData.subject);
    console.log('Message ID:', result.id);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.id,
      message: 'Email sent successfully' 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.log('❌ EDGE FUNCTION ERROR');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 