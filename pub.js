var _ = require('lodash');
var fs = require('fs');
var NATS = require('nats');

var nc = NATS.connect({
  verbose: true,
  json: true, 
  name: 'publisher', 
  token: 'GX5YF3L7DL90SP7PLFOUP9',
  // user: 'joe',
  // pass: 'GX5YF3L7DL90SP7PLFOUP9',
  // tls: {
  //   key: fs.readFileSync('./key.pem'),
  //   cert: fs.readFileSync('./cert.pem'),
  //   rejectUnauthorized: false
  // } 
});

nc.on('connect', () => {
  console.log('Connected to NATS');
});

setInterval(() => {
  let subject = 'dashboard';
  let tab = _.random(0,20);
  console.log(`Sending message to: ${subject}.${tab}`);
  nc.publish(`${subject}.${tab}`, { tab: tab, epoch: new Date().toISOString() });
}, 1000);

nc.on('disconnect', function() {
	console.log('disconnect');
});

nc.on('reconnecting', function() {
	console.log('reconnecting');
});

nc.on('reconnect', function(nc) {
	console.log('reconnect');
});

nc.on('close', function() {
	console.log('close');
});