var _ = require('lodash');
var fs = require('fs');
var NATS = require('nats');

var nats = NATS.connect({
  json: true, 
  name: 'publisher', 
  // token: 'GX5YF3L7DL90SP7PLFOUP9',
  user: 'joe',
  pass: 'GX5YF3L7DL90SP7PLFOUP9',
  tls: {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem'),
    rejectUnauthorized: false
  } 
});

nats.on('connect', () => {
  console.log('Publisher connected to NATS');
});

setInterval(() => {
  let subject = 'dashboard';
  let tab = _.random(1,5);
  console.log(`Sending message to: ${subject}.${tab}`);
  nats.publish(`${subject}.${tab}`, { tab: tab, epoch: new Date().toISOString() });
}, 2000);
