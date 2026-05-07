const fs = require('fs');
const josaa = JSON.parse(fs.readFileSync('public/nit_25_jr1.json', 'utf-8'));
josaa.colleges.forEach(c => {
  const parts = c.name.split(' ');
  const unique = new Set(parts);
  if (parts.length > unique.size + 2) {
    console.log(c.name);
  }
});
