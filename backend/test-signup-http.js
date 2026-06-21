const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/signup',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`BODY: ${data}`));
});

req.on('error', e => console.error(`Problem: ${e.message}`));

req.write(JSON.stringify({
  name: "Curl Test",
  email: `test${Date.now()}@example.com`,
  password: "Password123!"
}));
req.end();
