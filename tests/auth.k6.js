// k6 run --insecure-skip-tls-verify --vus 50 --stage 5s:1,5s:1,5s:1 --duration 5m auth.k6.js
import ws from "k6/ws";
import { check } from "k6";

const CR_LF = '\r\n';
const jwt = JSON.parse(open('./tokens.json'));

export default function() {
  var url = "wss://0.0.0.0:8443/events/websocket";
  var params = {};

  var res = ws.connect(url, params, function(socket) {
    
    socket.on('open', function() {
      console.log(`CONNECTED`);
    });

    socket.on('message', function(data) {

      if (data.match(/INFO+/)) {
        var cmd_connect = `CONNECT {"lang":"node","version":"1.2.2","verbose":true,"pedantic":false,"protocol":1,"auth_token":"${jwt[__ITER].token}","name":"web-client"}`;
        socket.send(cmd_connect);
        console.log(cmd_connect);
      }

      if (data.match(/OK+/)) {
        socket.setTimeout(function() {
          console.log(`TEST COMPLETED`);
          socket.close();
        }, 10000);
      }

    });

    socket.on('close', function() {
      console.log(`DISCONNECTED`);
    });

  });

  check(res, { "status is 101": (r) => r && r.status === 101 });
}


