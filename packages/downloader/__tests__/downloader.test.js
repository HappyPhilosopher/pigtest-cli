'use strict';

const downloader = require('..');
const assert = require('assert').strict;

assert.strictEqual(downloader(), 'Hello from downloader');
console.info("downloader tests passed");
