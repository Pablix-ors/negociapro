const https = require('https');

https.get('https://negociaproapp.vercel.app/dashboard', (res) => {
  console.log('Age header:', res.headers['age']);
  console.log('x-vercel-id:', res.headers['x-vercel-id']);
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const regex = /src="([^"]+\.js)"/g;
    let match;
    const urls = [];
    while ((match = regex.exec(data)) !== null) {
      urls.push(match[1]);
    }
    console.log('Found script URLs:', urls);
    if (urls.length > 0) {
      urls.forEach(u => {
        https.get('https://negociaproapp.vercel.app' + u, (sres) => {
          console.log('Script:', u, '=> status:', sres.statusCode);
        });
      });
    }
  });
});
