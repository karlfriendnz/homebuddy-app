#!/bin/bash

# Deploy Supabase Edge Functions
echo "🚀 Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase status &> /dev/null; then
    echo "❌ Not logged in to Supabase. Please run:"
    echo "supabase login"
    exit 1
fi

# Deploy the send-invite-email function
echo "📧 Deploying send-invite-email function..."
supabase functions deploy send-invite-email

if [ $? -eq 0 ]; then
    echo "✅ send-invite-email function deployed successfully!"
else
    echo "❌ Failed to deploy send-invite-email function"
    exit 1
fi

echo "🎉 All Edge Functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Set your RESEND_API_KEY in the Supabase dashboard:"
echo "   - Go to Settings > Edge Functions"
echo "   - Add RESEND_API_KEY environment variable"
echo "2. Test the email functionality in your app" 