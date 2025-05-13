/**
 * Direct SMTP Socket Connection Test
 * 
 * This script bypasses nodemailer entirely and attempts to establish a raw
 * TCP connection to the SMTP server to test basic network connectivity.
 */

const net = require('net');
const tls = require('tls');
require('dotenv').config();

// Get configuration from environment
const host = process.env.ZOHO_MAIL_HOST || 'smtp.zoho.com.au';
const port = parseInt(process.env.ZOHO_MAIL_PORT || '465');
const secure = process.env.ZOHO_MAIL_SECURE !== 'false'; // Default to true
const timeout = 30000; // 30 seconds

console.log('==== DIRECT SMTP CONNECTION TEST ====');
console.log(`Testing direct ${secure ? 'secure' : 'unsecure'} connection to ${host}:${port}`);
console.log(`Connection timeout: ${timeout}ms`);

// Print environment variables for debugging
console.log('\nEnvironment variables:');
console.log(`ZOHO_MAIL_HOST: ${process.env.ZOHO_MAIL_HOST || 'not set'}`);
console.log(`ZOHO_MAIL_PORT: ${process.env.ZOHO_MAIL_PORT || 'not set'}`);
console.log(`ZOHO_MAIL_USER: ${process.env.ZOHO_MAIL_USER || 'not set'}`);
console.log(`ZOHO_MAIL_PASSWORD: ${process.env.ZOHO_MAIL_PASSWORD ? 'set' : 'not set'}`);
console.log(`ZOHO_MAIL_FROM: ${process.env.ZOHO_MAIL_FROM || 'not set'}`);
console.log(`SEND_TEST_MAIL_TO: ${process.env.SEND_TEST_MAIL_TO || 'not set'}`);

// Dump some network information
console.log('\nNetwork info:');
try {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log('Network interfaces:');
  
  Object.keys(interfaces).forEach(interfaceName => {
    interfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4') {
        console.log(`  ${interfaceName}: ${iface.address}`);
      }
    });
  });
} catch (err) {
  console.error('Error getting network interfaces:', err.message);
}

// Test DNS resolution
console.log('\nResolving DNS for', host);
const dns = require('dns');

// Try both IPv4 and IPv6
dns.resolve(host, (err, addresses) => {
  if (err) {
    console.error('DNS resolution failed:', err.message);
    // Try a direct IP connection if DNS failed
    tryDirectConnection(host);
    return;
  }
  
  console.log('DNS resolution successful:', addresses);
  // Continue with connecting
  tryDirectConnection(host);
});

function tryDirectConnection(serverHost) {
  console.log(`\nAttempting direct ${secure ? 'TLS' : 'TCP'} connection to ${serverHost}:${port}...`);
  
  let connectionStartTime = Date.now();
  let socket;
  
  // For secure connections (port 465), use TLS directly
  if (secure) {
    socket = tls.connect({
      host: serverHost,
      port: port,
      rejectUnauthorized: false, // Accept any certificate
      timeout: timeout
    });
  } else {
    // For non-secure connections (port 25/587), use raw TCP
    socket = net.createConnection({
      host: serverHost,
      port: port,
      timeout: timeout
    });
  }
  
  // Set encoding
  socket.setEncoding('utf8');
  
  // Connection successful
  socket.on('connect', () => {
    const elapsed = Date.now() - connectionStartTime;
    console.log(`✅ Connected to ${serverHost}:${port} in ${elapsed}ms`);
    console.log('Waiting for greeting from server...');
  });
  
  // Server data received
  socket.on('data', (data) => {
    console.log('Server says:', data.trim());
    
    // Try simple EHLO command
    console.log('Sending EHLO command...');
    socket.write('EHLO localhost\r\n');
    
    // Wait for response, then quit
    setTimeout(() => {
      console.log('Sending QUIT command...');
      socket.write('QUIT\r\n');
      
      setTimeout(() => {
        console.log('Closing connection...');
        socket.end();
      }, 1000);
    }, 2000);
  });
  
  // Connection timeout
  socket.on('timeout', () => {
    console.error(`❌ Connection timed out after ${timeout}ms`);
    socket.destroy();
  });
  
  // Connection error
  socket.on('error', (err) => {
    console.error(`❌ Connection error: ${err.message}`);
    
    // If this is a connection refused error, try with the direct IP
    if (err.code === 'ECONNREFUSED' && serverHost !== '103.91.166.141') {
      console.log('\nTrying direct connection to IP address 103.91.166.141...');
      tryDirectConnection('103.91.166.141');
    }
  });
  
  // Connection closed
  socket.on('close', (hadError) => {
    console.log(`Connection closed ${hadError ? 'with error' : 'cleanly'}`);
    
    if (serverHost !== '103.91.166.141' && hadError) {
      console.log('\nTrying direct connection to IP address 103.91.166.141...');
      tryDirectConnection('103.91.166.141');
    } else {
      console.log('==== TEST COMPLETE ====');
    }
  });
} 