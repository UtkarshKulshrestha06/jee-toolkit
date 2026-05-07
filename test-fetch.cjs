(async () => {
  const https = require('https');
  https.get('https://commons.wikimedia.org/wiki/Special:FilePath/NITT_logo.png', (res) => {
    console.log("Status Code:", res.statusCode);
    console.log("Headers:", res.headers['content-type'], res.headers.location);
  });
})();
