const chai = require('chai');

const chaiXml = require('chai-xml');
const chaiDatetime = require('chai-datetime');
const dirtyChai = require('dirty-chai');
const fs = require('fs');
const path = require('path');
global.verquire = require('../utils/verquire');

global.expect = chai.expect;

chai.use(chaiXml);
chai.use(chaiDatetime);
chai.use(dirtyChai);

// Some integration tests write output files to ./spec/out (e.g. wb.test.xlsx).
// Ensure the directory exists in all environments (CI runners don't create it).
fs.mkdirSync(path.join(__dirname, '..', 'out'), {recursive: true});
