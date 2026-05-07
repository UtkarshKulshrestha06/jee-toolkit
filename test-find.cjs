const fs = require('fs');
const josaa = JSON.parse(fs.readFileSync('public/nit_25_jr1.json', 'utf-8'));
const inst = JSON.parse(fs.readFileSync('public/nit_participating_institutes.json', 'utf-8'));

const cleanName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const college = josaa.colleges[0]; // Jalandhar
const norm = cleanName(college.name);
const instInfo = inst.find(i => cleanName(i.institute_name) === norm);
console.log("Matched JOSAA:", college.name);
console.log("Found Inst:", instInfo.institute_name);
console.log("Rank Overall:", instInfo.nirf_ranking_overall);
