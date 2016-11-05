var dgram = require('dgram');
var YAML = require('yamljs');
var HOST = '192.168.0.25';
var PORT = 80;
var RMDevices = YAML.load('RMDevices.yaml');


function hex2bin(hex){
   return new Buffer(hex, "hex");
}

exports.controlDevice = function(type, name, action) {

    actionCount = RMDevices[type][name][action].length;
    if (typeof(RMDevices[type][name][action]['count']) == "undefined") {
        RMDevices[type][name][action]['count'] = 0;
        currentCount = 0;
    } else {
        RMDevices[type][name][action]['count']++;
        currentCount = RMDevices[type][name][action]['count'];
    }
    currentCount = currentCount % actionCount;

    UDPInstruction = RMDevices[type][name][action][currentCount];
    UDPInstruction = new Buffer(hex2bin(UDPInstruction));

    var client = dgram.createSocket('udp4');

    client.send(UDPInstruction, 0, UDPInstruction.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
        console.log('UDP message sent to ' + currentCount);
        client.close();
    });

}
