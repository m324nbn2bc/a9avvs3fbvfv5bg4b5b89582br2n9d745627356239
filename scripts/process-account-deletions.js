const API_URL = process.env.REPLIT_DEV_DOMAIN 
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.REPLIT_DOMAINS 
    ? `https://${process.env.REPLIT_DOMAINS.split(',')[0]}`
    : 'http://localhost:5000';

const CRON_SECRET = process.env.CRON_SECRET;

async function processAccountDeletions() {
  console.log('Starting account deletion processing...');
  console.log(`API URL: ${API_URL}`);
  
  if (!CRON_SECRET) {
    console.error('ERROR: CRON_SECRET environment variable is not set');
    process.exit(1);
  }

  try {
    const response = await fetch(`${API_URL}/api/cron/process-deletions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('Account deletion processing completed successfully');
      console.log(`Processed: ${data.processed} accounts`);
      console.log(`Errors: ${data.errors} accounts`);
      if (data.deletedUsers && data.deletedUsers.length > 0) {
        console.log('Deleted user IDs:', data.deletedUsers.join(', '));
      }
    } else {
      console.error('Failed to process deletions:', data.error || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error calling deletion API:', error.message);
    process.exit(1);
  }
}

processAccountDeletions();
