const http = require('https');

const data = JSON.stringify({
  model: 'anthropic/claude-sonnet-4.6',
  messages: [{ role: 'user', content: 'Hello, how are you?' }]
});

const req = http.request('https://routerai.ru/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-idWLIk8WBHJJiwn-Y2oyMNdW0ckjsfIa',
    'Content-Type': 'application/json'
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Without Bearer:', body));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
