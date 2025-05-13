const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');
require('dotenv').config();

/**
 * Comprehensive network connectivity test
 * This script tests various network aspects to help diagnose connectivity issues
 */
async function testNetworkConnectivity() {
  console.log('============= NETWORK CONNECTIVITY TESTS =============');
  console.log(`Running tests at: ${new Date().toISOString()}`);
  console.log(`Container hostname: ${require('os').hostname()}`);

  // 1. DNS resolution tests
  console.log('\n1. DNS RESOLUTION TESTS:');
  const dnsTestHosts = [
    'google.com',
    'cloudflare.com',
    'zoho.com',
    'zoho.com.au',
    process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au',
  ];

  for (const host of dnsTestHosts) {
    try {
      console.log(`\nResolving ${host}...`);
      const addresses = await new Promise((resolve, reject) => {
        dns.resolve(host, (err, addresses) => {
          if (err) reject(err);
          else resolve(addresses);
        });
      });
      console.log(`✅ Success: ${host} => ${JSON.stringify(addresses)}`);
      
      // Try reverse lookup
      try {
        const hostname = await new Promise((resolve, reject) => {
          dns.reverse(addresses[0], (err, hostnames) => {
            if (err) reject(err);
            else resolve(hostnames);
          });
        });
        console.log(`  Reverse lookup: ${addresses[0]} => ${hostname}`);
      } catch (revErr) {
        console.log(`  Reverse lookup failed: ${revErr.message}`);
      }
    } catch (error) {
      console.error(`❌ Failed: ${host} - ${error.message}`);
    }
  }

  // 2. Direct socket connection tests
  console.log('\n2. SOCKET CONNECTION TESTS:');
  const socketTests = [
    { host: 'google.com', port: 443 },
    { host: 'cloudflare.com', port: 443 },
    { host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au', port: 465 },
    { host: process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au', port: 587 },
    { host: '103.91.166.141', port: 465 }, // Direct IP for Zoho SMTP
  ];

  for (const test of socketTests) {
    try {
      console.log(`\nConnecting to ${test.host}:${test.port}...`);
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({
          host: test.host,
          port: test.port,
          timeout: 10000
        });
        
        socket.on('connect', () => {
          console.log(`✅ Success: Connected to ${test.host}:${test.port}`);
          socket.end();
          resolve();
        });
        
        socket.on('timeout', () => {
          reject(new Error('Connection timed out'));
          socket.destroy();
        });
        
        socket.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error(`❌ Failed: ${test.host}:${test.port} - ${error.message}`);
    }
  }

  // 3. HTTP/HTTPS connection tests
  console.log('\n3. HTTP/HTTPS CONNECTION TESTS:');
  const httpTests = [
    'https://google.com',
    'https://cloudflare.com',
    'https://zoho.com',
    'https://zoho.com.au',
    'https://1.1.1.1',
  ];

  for (const url of httpTests) {
    try {
      console.log(`\nFetching ${url}...`);
      await new Promise((resolve, reject) => {
        const request = (url.startsWith('https') ? https : http).get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Docker-Network-Test'
          }
        }, (res) => {
          console.log(`✅ Success: ${url} - Status: ${res.statusCode}`);
          res.destroy();
          resolve();
        });
        
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Request timed out'));
        });
        
        request.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error(`❌ Failed: ${url} - ${error.message}`);
    }
  }

  // 4. Test DNS servers configuration
  console.log('\n4. DNS SERVERS CONFIGURATION:');
  try {
    console.log('Checking DNS resolver configuration...');
    const resolvConf = require('fs').readFileSync('/etc/resolv.conf', 'utf8');
    console.log(resolvConf);
  } catch (error) {
    console.error(`Failed to read resolv.conf: ${error.message}`);
  }

  console.log('\n============= TESTS COMPLETED =============');
}

// Run all tests
testNetworkConnectivity().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 