(async () => {
    const https = require('https');
    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    };
    https.get('https://upload.wikimedia.org/wikipedia/commons/0/0b/NITT_logo.png', options, (res) => {
      console.log("Status Code:", res.statusCode);
      console.log("Headers:", res.headers['content-type']);
    });
  })();
