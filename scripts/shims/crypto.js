'use strict';

const { Buffer } = require('buffer');

function randomBytes(size) {
  if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== 'function') {
    throw new Error('exceljs browser bundle: WebCrypto getRandomValues() unavailable');
  }
  const arr = new Uint8Array(size);
  globalThis.crypto.getRandomValues(arr);
  return Buffer.from(arr.buffer);
}

module.exports = {
  randomBytes,
};

