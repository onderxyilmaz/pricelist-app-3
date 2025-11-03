/**
 * Rate Limit Test Script
 * Tests the rate limiting functionality of the auth endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/auth/login';

async function testRateLimit() {
  console.log('🧪 Testing Rate Limit for Login Endpoint\n');
  console.log(`Rate Limit Config: 5 requests per 15 minutes\n`);
  console.log('Sending 7 login requests rapidly...\n');

  const testData = {
    email: 'wrong@test.com',
    password: 'wrongpassword'
  };

  for (let i = 1; i <= 7; i++) {
    try {
      const start = Date.now();
      const response = await axios.post(API_URL, testData);
      const duration = Date.now() - start;

      console.log(`✅ Request ${i}: SUCCESS (${duration}ms)`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}\n`);
    } catch (error) {
      const duration = Date.now() - start;

      if (error.response?.status === 429) {
        console.log(`❌ Request ${i}: RATE LIMITED (${duration}ms)`);
        console.log(`   Status: 429 Too Many Requests`);
        console.log(`   Message: ${error.response.data.message}\n`);
      } else {
        console.log(`ℹ️  Request ${i}: Other Error (${duration}ms)`);
        console.log(`   Status: ${error.response?.status || 'Network Error'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}\n`);
      }
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('📊 Test Complete!');
  console.log('\nExpected Result: First 5 requests should succeed (or fail with wrong credentials),');
  console.log('                 Requests 6-7 should be rate limited (429 status)');
}

testRateLimit().catch(console.error);
