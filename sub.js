var _ = require('lodash');
var fs = require('fs');
var NATS = require('nats');

var nats = NATS.connect({
  verbose: true,
  json: true, 
  name: 'subscriber', 
  token: 'GX5YF3L7DL90SP7PLFOUP9',
  // user: 'joe',
  // pass: 'GX5YF3L7DL90SP7PLFOUP9',
  // tls: {
  //   key: fs.readFileSync('./key.pem'),
  //   cert: fs.readFileSync('./cert.pem'),
  //   rejectUnauthorized: false
  // } 
});

nats.on('connect', () => {
  console.log('Subscriber connected to NATS');

  // nats.subscribe('dashboard.*', (e) => {
  //   console.log('Received message from subscriber:', JSON.stringify(e, null, 0));
  // });

  nats.subscribe('system.api', (req, reply) => {
    console.log('Received request from:', JSON.stringify(req, null, 0));
    nats.publish(reply, { epoch: Date.now(), api: 'system.api' });
  });
});

