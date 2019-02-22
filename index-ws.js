const pkg = require('./package')
const _ = require('lodash');
const fs = require('fs');
const http = require('http');
const https = require('https');
const uuid = require('uuid/v4');
const nuid = require('nuid').next;
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';
const CR_LF = '\r\n';

const server_info = {
  server_id: nuid,
  version: pkg.version,
  host: '0.0.0.0',
  port: process.env.PORT || 8080,
  auth_required: true,
  tls_required: false
}

const server_config = {
  disconnect_timeout: 250
}

const server = new http.createServer();
// const server = new https.createServer({
//   cert: fs.readFileSync('./cert.pem'),
//   key: fs.readFileSync('./key.pem')
// });

const ws = new WebSocket.Server({ server });

let eventLoop = async (connection, req) => {

  connection.auth = false;
  connection.id = nuid();
  connection.ip = req.connection.remoteAddress;
  connection.pre = `${connection.ip},${connection.id}`;

  // disconnect the client 
  let connection_timeout = setTimeout(() => {
    clearTimeout(connection_timeout);
    // if (!connection.auth) {
    //   console.log(`${connection.pre} - Authentication timeout`);
    //   connection.close();
    // }
  }, server_config.disconnect_timeout);

  let onDataEvent = (data) => {

    if (data === 'PING' + CR_LF) {
      connection.send('+OK' + CR_LF + 'PONG' + CR_LF);
      console.log(`${connection.pre} - +OK PONG`);
    }

    if (data.match(/SUB+/)) {
      connection.send('+OK' + CR_LF);
      console.log(`${connection.pre} - +OK SUB`);
    }

    if (data.match(/PUB+/)) {
      connection.send('+OK' + CR_LF + 'MSG' + CR_LF);
      console.log(`${connection.pre} - +OK PUB`);
    }

    if (data.match(/CONNECT+/)) {
      try {
        var req = JSON.parse( data.substring( data.lastIndexOf('{'), data.lastIndexOf('}') + 1 ) );
        jwt.verify(req.auth_token, 'cactus');
        connection.auth = true;
        clearTimeout(connection_timeout);
        console.log(`${connection.pre} - Connected`);
      }
      catch (e) {
        console.log(`${connection.pre} - ${e.name}, ${e.message}`);
        console.log(`${connection.pre} - Authentication failed`);
        clearTimeout(connection_timeout);
        connection.close();
      }
    }
  };

  let onOpenEvent = () => {
    console.log(`${connection.pre} - Connection open`);
  };

  let onCloseEvent = () => {
    console.log(`${connection.pre} - Disconnected`);
  };

  connection.on('message', onDataEvent);
  connection.on('open', onOpenEvent);
  connection.on('close', onCloseEvent);

  connection.send('INFO ' + JSON.stringify(_.merge(server_info, { client_id: connection.id }), null, 0) + CR_LF);  
}

ws.on('connection', eventLoop);
 
server.listen(port, host, () => {
  console.log(`Websocket server started on ${host}:${port}`);
});

// hs -p 8443 -S -C cert.pem -K key.pem ../ws-nats/

