// Assumes an echo server that is listening on port 8000.
const tls = require('tls');
const fs = require('fs');

const tls_port = process.env.TLS_PORT || 8443;

const options = {
  // Necessary only if the server requires client certificate authentication.
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),

  // Necessary only if the server uses a self-signed certificate.
  ca: [ fs.readFileSync('./cert.pem') ],

  // TLS version 1.2, cipher suite TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256

  ciphers: 'ECDHE-RSA-AES128-GCM-SHA256',
  minVersion: 'TLSv1.2',

  // Necessary only if the server's cert isn't for "localhost".
  checkServerIdentity: () => { return null; },
};

const socket = tls.connect(tls_port, options, () => {
  console.log('client connected', socket.authorized ? 'authorized' : 'unauthorized');
  // process.stdin.pipe(socket);
  // process.stdin.resume();
});

socket.setEncoding('utf8');
socket.on('data', (data) => {
  // console.log(`Received from server: ${data}`);
});

socket.on('end', () => {
  console.log('server end connection');
});
