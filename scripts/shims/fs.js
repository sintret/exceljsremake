'use strict';

function notAvailable(name) {
  return function fsNotAvailable() {
    throw new Error(`exceljs browser bundle: fs.${name} is not available in the browser`);
  };
}

module.exports = {
  createReadStream: notAvailable('createReadStream'),
  createWriteStream: notAvailable('createWriteStream'),
  readFile: notAvailable('readFile'),
  readFileSync: notAvailable('readFileSync'),
  writeFile: notAvailable('writeFile'),
  writeFileSync: notAvailable('writeFileSync'),
  promises: {},
};

