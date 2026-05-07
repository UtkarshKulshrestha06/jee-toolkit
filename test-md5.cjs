const crypto = require('crypto');
console.log(crypto.createHash('md5').update('NITT_logo.png').digest('hex'));
