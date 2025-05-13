# Supabase Enquiries Webhook

This project includes a webhook endpoint that listens for new enquiries in Supabase and sends Slack notifications and email confirmations to users.

## Setup Instructions

### Docker Setup

This project can be run using Docker. Follow these steps to get started:

#### Using Docker Compose (Recommended)

1. Create a `.env` file based on the `.env.example` template
2. Run the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. The application will be available at http://localhost:3000

#### Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t admin-dashboard .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env -d admin-dashboard
   ```

3. The application will be available at http://localhost:3000

### Standard Setup

### 1. Environment Variables

Make sure your `.env` file includes the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
SLACK_ENQUIRIES_WEBHOOK=your_slack_webhook_url
SUPABASE_WEBHOOK_SECRET=your_webhook_secret  # Optional but recommended for security
# Email notification settings
ZOHO_MAIL_HOST=smtp.zoho.com
ZOHO_MAIL_PORT=465
ZOHO_MAIL_USER=your_zoho_email@domain.com
ZOHO_MAIL_PASSWORD=your_password_or_app_specific_password
ZOHO_MAIL_FROM=your_sender_email@domain.com  # Optional, defaults to ZOHO_MAIL_USER
ZOHO_MAIL_SECURE=true  # Optional, defaults to true```

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
### Docker Troubleshooting

## Testing Email Notifications

The project includes several utilities to test email notifications locally before deploying to production.

### Prerequisites

Before running the tests, make sure you have:

1. Set up all the required environment variables in your `.env` file (see Environment Variables section)
2. Installed all dependencies with `npm install` or `yarn install`

### Test Commands

#### 1. Basic SMTP Connection Test

This test verifies that your SMTP connection to Zoho Mail is working correctly:

```bash
npx ts-node src/notifications/simpleSMTPTest.ts
```

This will attempt to connect to Zoho Mail and send a simple test email to the admin email address.

#### 2. Direct SMTP Test

A simplified test that directly uses nodemailer without any custom code:

```bash
npx ts-node src/notifications/directSMTPTest.ts
```

#### 3. Template Loading Test

Verifies that email templates are loading and processing correctly:

```bash
npx ts-node src/notifications/templateTest.ts
```

#### 4. Custom Enquiry Test

Sends a test email using a custom enquiry object:

```bash
npx ts-node src/notifications/customTest.ts
```

You can edit this file to customize the test enquiry data.

#### 5. Standard Test

Runs the standard email notification test:

```bash
npx ts-node src/notifications/testMailNotifications.ts
```

### Troubleshooting Email Issues

If you're having issues with email delivery:

1. **Check Spam/Junk Folders**: Test emails often end up in spam folders
2. **Verify SMTP Settings**: Double-check your Zoho Mail SMTP settings
3. **App-Specific Password**: If using 2FA with Zoho, you need an app-specific password
4. **Enable Debug Logging**: Set `debug: true` in the transporter configuration
5. **Check Email Headers**: If you receive emails, check headers for delivery issues
6. **DNS Configuration**: For production, set up SPF, DKIM, and DMARC records
1. Check container logs:
   ```bash
   docker logs <container_id>
   ```

2. Verify environment variables are correctly passed to the container:
   ```bash
   docker exec <container_id> env
   ```

3. If you need to access the container shell:
   ```bash
   docker exec -it <container_id> /bin/sh
   ```
