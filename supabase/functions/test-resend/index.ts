import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  console.log('=== TEST RESEND FUNCTION STARTED ===');

  // Handle CORS
  if (req.method === 'OPTIONS') {
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
    // Get Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    console.log('Resend API Key exists:', !!resendApiKey);
    console.log('Resend API Key length:', resendApiKey?.length || 0);

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Resend API key not found' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Test Resend API with a simple email
    const testEmail = {
      from: 'HomeBuddy <hello@homebuddy.nz>',
      to: 'karlfriend.nz@gmail.com',
      subject: 'Test Email from HomeBuddy',
      html: '<h1>Test Email</h1><p>This is a test email from the HomeBuddy Edge Function.</p>',
    };

    console.log('Sending test email...');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEmail),
    });

    console.log('Resend response status:', response.status);
    console.log('Resend response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Resend API error:', errorText);
      return new Response(JSON.stringify({ 
        error: 'Resend API test failed',
        status: response.status,
        details: errorText
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const result = await response.json();
    console.log('Resend API success:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Resend API test successful',
      result 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Test function error:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 