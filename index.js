const pkg = require('./package')
const fs = require('fs');
const _ = require('lodash');
const net = require('net');
const http = require('http');
const https = require('https');
const nuid = require('nuid').next();
const sockjs = require('sockjs');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';
const CR_LF = '\r\n';
const nats_port = 4222;
const nats_host = '0.0.0.0';

// let server = http.createServer();
let server = https.createServer({
  cert: fs.readFileSync('./cert.pem'),
  key: fs.readFileSync('./key.pem')
});
let socket = sockjs.createServer();

const server_info = {
  server_id: nuid,
  version: pkg.version,
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  auth_required: true,
  tls_required: false
}

const server_config = {
  disconnect_timeout: 200
}

let eventLoop = async (connection) => {

  let tcp = new net.Socket();

  connection.auth = false;
  connection.nats = false;
  connection.pre = `${connection.remoteAddress},${connection.id}`;

  // disconnect the client 
  let connection_timeout = setTimeout(() => {
    clearTimeout(connection_timeout);
    if (!connection.auth) {
      console.log(`${connection.pre} - Connection timeout`);
      connection.close();
    }
  }, server_config.disconnect_timeout);

  let onDataEvent = (data) => {

    if (connection.nats) {
      tcp.write(data);
      return;
    }

    if (data === 'PING' + CR_LF) {
      connection.write('+OK' + CR_LF + 'PONG' + CR_LF);
      console.log(`${connection.pre} - +OK PONG`);
    }

    if (data.match(/CONNECT+/)) {
      try {
        var req = JSON.parse( data.substring( data.lastIndexOf('{'), data.lastIndexOf('}') + 1 ) );
        jwt.verify(req.auth_token, 'cactus');
        
        connection.auth = true;
        clearTimeout(connection_timeout);

        console.log(`${connection.pre} - Connected`);

        // this is the local auth token for NATS server
        req.auth_token = 'GX5YF3L7DL90SP7PLFOUP9';

        tcp.connect(nats_port, nats_host, () => {
          console.log(`${connection.pre} - Connected to NATS server`);
          tcp.write('CONNECT ' + JSON.stringify(req, null, 0) + CR_LF );
          connection.nats = true;
        });
      }
      catch (e) {
        console.log(`${connection.pre} - ${e.name}, ${e.message}`);
        console.log(`${connection.pre} - Authentication failed`);
        clearTimeout(connection_timeout);
        connection.close();
      }
    }
  };

  let onCloseEvent = () => {
    console.log(`${connection.pre} - Disconnected`);
    if (connection.nats) tcp.end();
  };

  let onTCPDataEvent = (data) => {
    connection.write(data);
  }

  let onTCPCloseEvent = () => {
    console.log(`${connection.pre} - Disconnected from NATS server`);
    tcp.end();
    connection.close();
  }  

  tcp.on('data', onTCPDataEvent);
  tcp.on('close', onTCPCloseEvent);

  connection.on('data', onDataEvent);
  connection.on('close', onCloseEvent);

  connection.write('INFO ' + JSON.stringify(_.merge(server_info, { client_id: connection.id }), null, 0) + CR_LF);
};

server.listen(port, host, () => {
  console.log(`Websocket server started on ${host}:${port}`);
});

socket.installHandlers(server, { prefix: '/events', transports: ['websocket'], log: () => {} });

socket.on('connection', eventLoop);

