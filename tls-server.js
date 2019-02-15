const tls = require('tls');
const fs = require('fs');

const tls_port = process.env.TLS_PORT || 8443;

const options = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),

  // This is necessary only if using client certificate authentication.
  requestCert: true,

  // This is necessary only if the client uses a self-signed certificate.
  ca: [ fs.readFileSync('./cert.pem') ]
};

const server = tls.createServer(options, (socket) => {
  console.log('client connected', socket.authorized ? 'authorized' : 'unauthorized');
  socket.write('welcome! - hello from TLS server!\n');
  socket.setEncoding('utf8');
  socket.pipe(socket);
});

server.listen(tls_port, () => {
  console.log(`TLS server running 0.0.0.0:${tls_port}`);
});
