const fs = require('fs');
const josaa = JSON.parse(fs.readFileSync('public/nit_25_jr1.json', 'utf-8'));
const inst = JSON.parse(fs.readFileSync('public/nit_participating_institutes.json', 'utf-8'));

const cleanName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const instNames = inst.map(i => cleanName(i.institute_name));

josaa.colleges.forEach(c => {
  const cName = cleanName(c.name);
  if (!instNames.includes(cName)) {
    console.log("FAILED TO MATCH:", c.name);
  }
});
console.log("Done testing");
