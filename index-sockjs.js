const pkg = require('./package')
const _ = require('lodash');
const http = require('http');
const nuid = require('nuid').next();
const sockjs = require('sockjs');
const jwt = require('jsonwebtoken');

const port = process.env.PORT || 8080;
const host = '0.0.0.0';
const CR_LF = '\r\n';

let server = http.createServer();
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
  auth_required: true,
  disconnect_timeout: 200
}

let eventLoop = async (connection) => {

  connection.auth = false;
  connection.pre = `${connection.remoteAddress},${connection.id}`;

  // disconnect the client 
  let connection_timeout = setTimeout(() => {
    clearTimeout(connection_timeout);
    if (!connection.auth) {
      console.log(`${connection.id} - Connection timeout`);
      connection.close();
    }
  }, server_config.disconnect_timeout);

  let onDataEvent = (data) => {

    if (data === 'PING' + CR_LF) {
      connection.write('+OK' + CR_LF + 'PONG' + CR_LF);
      console.log(`${connection.id} - +OK PONG`);
    }

    if (data.match(/SUB+/)) {
      connection.write('+OK' + CR_LF);
      console.log(`${connection.id} - +OK SUB`);
    }

    if (data.match(/PUB+/)) {
      connection.write('+OK' + CR_LF + 'MSG' + CR_LF);
      console.log(`${connection.id} - +OK PUB`);
    }

    if (data.match(/CONNECT+/)) {
      try {
        var req = JSON.parse( data.substring( data.lastIndexOf('{'), data.lastIndexOf('}') + 1 ) );
        jwt.verify(req.auth_token, 'cactus');
        
        connection.auth = true;
        clearTimeout(connection_timeout);

        console.error(`${connection.id} - Connected`);
      }
      catch (e) {
        console.error(`${connection.id} - ${e.name}, ${e.message}`);
        console.error(`${connection.id} - Authentication failed`);
        clearTimeout(connection_timeout);
        connection.close();
      }
    }
  };

  let onCloseEvent = () => {
    console.log(`${connection.id} - Disconnected`);
  };

  connection.on('data', onDataEvent);
  connection.on('close', onCloseEvent);

  connection.write('INFO ' + JSON.stringify(_.merge(server_info, { client_id: connection.id }), null, 0) + CR_LF);
};

server.listen(port, host, () => {
  console.log(`Websocket server started on ${host}:${port}`);
});

socket.installHandlers(server, { prefix: '/', transports: ['websocket'], log: () => {} });

socket.on('connection', eventLoop);

