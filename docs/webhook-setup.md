# Supabase Webhook Setup Guide

## Overview

This guide explains how to set up a Supabase webhook to notify your application when new enquiries are created.

## Webhook URL

The webhook URL for your application is:

```
https://select-pet-corgi.ngrok-free.app/api/webhooks/supabase
```

## Setting up the Webhook in Supabase

1. Log in to your Supabase dashboard
2. Navigate to your project
3. Go to Database → Webhooks
4. Click "Create a new webhook"
5. Configure the webhook with the following settings:

### Basic Configuration

- **Name**: `enquiries-webhook` (or any descriptive name)
- **Table**: `enquiries`
- **Events**: Select `INSERT` (to trigger when new enquiries are created)
- **URL**: `https://select-pet-corgi.ngrok-free.app/api/webhooks/supabase`

### Advanced Configuration

- **HTTP Method**: `POST`
- **Headers**: You can leave this empty
- **Request Timeout**: `5000` (5 seconds is usually sufficient)

### Payload Format

For the payload format, you can use the default format or customize it. The application is configured to handle different payload formats, but the simplest is:

```json
{
  "type": "{{event}}",
  "table": "{{table}}",
  "record": {{record}}
}
```

## Testing the Webhook

You can test if your webhook endpoint is accessible by visiting:

```
https://select-pet-corgi.ngrok-free.app/api/webhooks/supabase/test
```

This should return a JSON response confirming the webhook endpoint is working.

## Troubleshooting

### Webhook Not Triggering

1. Check that your ngrok tunnel is running and the URL is correct
2. Verify that the webhook is enabled in Supabase
3. Check the server logs for any errors
4. Try creating a test enquiry to trigger the webhook

### Error in Webhook Processing

1. Check the server logs for detailed error messages
2. Verify that the Supabase client is configured correctly with the right credentials
3. Ensure the database tables (`enquiries` and `propelity_users`) exist and have the expected structure

## Webhook Security

For production environments, it's recommended to add webhook signature verification. This can be configured in the Supabase webhook settings by adding a secret key, and then updating the application code to verify the signature.