# Supabase Enquiries Webhook

This project includes a webhook endpoint that listens for new enquiries in Supabase and sends Slack notifications.

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file includes the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SLACK_ENQUIRIES_WEBHOOK=your_slack_webhook_url
SUPABASE_WEBHOOK_SECRET=your_webhook_secret  # Optional but recommended for security
```

### 2. Configure Supabase Database Webhook

To set up the webhook in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to Database → Webhooks
3. Click "Create a new webhook"
4. Configure the webhook with these settings:
   - Name: `enquiries_notification`
   - Table: `enquiries`
   - Events: Select only `INSERT` (for new enquiries)
   - URL: Your server URL + `/api/webhooks/supabase` (e.g., `https://your-server.com/api/webhooks/supabase`)
   - HTTP Method: `POST`
   - Security: If you want to use a webhook secret (recommended), generate a random string and add it to both Supabase and your `.env` file

### 3. Make Your Server Publicly Accessible

For Supabase to send webhook events to your server, it needs to be publicly accessible. Options include:

- Deploy to a hosting service (Heroku, Vercel, etc.)
- Use a service like ngrok for local development

### 4. Testing the Webhook

To test if the webhook is working:

1. Start your server
2. Create a new enquiry in Supabase (either through your website or directly in the database)
3. Check your server logs for webhook events
4. Verify that the Slack notification is sent

## Troubleshooting

If notifications aren't being sent:

1. Check your server logs for webhook events
2. Verify that the Supabase webhook is configured correctly
3. Ensure your server is publicly accessible
4. Check that the Slack webhook URL is correct
5. Verify that the `enquiries` table structure matches what your code expects