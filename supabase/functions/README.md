# Supabase Edge Functions

This directory contains Edge Functions for the HomeBuddy application.

## Functions

### send-invite-email

Sends invitation emails to family members using the Resend.com API.

**Endpoint:** `POST /functions/v1/send-invite-email`

**Request Body:**
```json
{
  "to": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "householdName": "Smith Family",
  "inviteCode": "ABC123",
  "role": "adult",
  "invitedBy": "Jane Smith"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "resend_message_id",
  "message": "Email sent successfully"
}
```

## Setup

### 1. Install Dependencies

```bash
# Install Supabase CLI globally
npm install -g supabase

# Login to Supabase
supabase login
```

### 2. Configure Environment Variables

In your Supabase dashboard:
1. Go to Settings > Edge Functions
2. Add the following environment variable:
   - `RESEND_API_KEY`: Your Resend.com API key

### 3. Deploy Functions

```bash
# Deploy all functions
./scripts/deploy-edge-functions.sh

# Or deploy individual functions
supabase functions deploy send-invite-email
```

### 4. Test Functions

```bash
# Test locally (optional)
supabase functions serve

# Test deployed function
curl -X POST https://your-project.supabase.co/functions/v1/send-invite-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "householdName": "Test Household",
    "inviteCode": "TEST123",
    "role": "adult",
    "invitedBy": "Admin User"
  }'
```

## Resend.com Setup

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add the API key to your Supabase Edge Functions environment variables
4. Optionally, verify your domain for better deliverability

## Email Template

The function sends beautifully formatted HTML emails with:
- HomeBuddy branding
- Invite code prominently displayed
- Step-by-step instructions
- Role information
- Expiration notice

## Error Handling

The function includes comprehensive error handling:
- Input validation
- API error responses
- CORS support
- Detailed error logging

## Security

- CORS headers configured for web access
- Input validation and sanitization
- Environment variable protection
- Rate limiting (handled by Supabase) 