import process from 'process/browser';
import { Buffer } from 'buffer';

// Ensure common Node globals exist for browser bundles.
globalThis.process = process;
globalThis.Buffer = Buffer;

