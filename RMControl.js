var dgram = require('dgram');
var YAML = require('yamljs');
var HOST = '192.168.0.25';
var PORT = 80;
var RMDevices = YAML.load('RMDevices.yaml');
var exec = require('child_process').exec;


function hex2bin(hex){
   return new Buffer(hex, "hex");
}

function hexStringToByte(str) {
    if (!str) {
        return new Uint8Array();
    }

    var a = [];
    for (var i = 0, len = str.length; i < len; i+=2) {
        a.push(parseInt(str.substr(i,2),16));
    }

    return new Uint8Array(a);
}

function byteToHexString(uint8arr) {
    if (!uint8arr) {
        return '';
        }

    var hexStr = '';
    for (var i = 0; i < uint8arr.length; i++) {
        var hex = (uint8arr[i] & 0xff).toString(16);
        hex = (hex.length === 1) ? '0' + hex : hex;
        hexStr += hex;
    }

    return hexStr.toUpperCase();
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.controlDevice = function(type, name, action) {
    // Packet header construction from
    // https://github.com/mjg59/python-broadlink
    UDPInstruction = RMDevices[type][name][action];

    // Generate packet header with checksum values set to 0
    Header = UDPInstruction.substring(0, 112);
    Header = hexStringToByte(Header);
    Header[32] = Header[33] = 0;
    Header[40] = getRandomInt(0, 255);
    Header[41] = getRandomInt(0, 255);

    // Set the checksum initialisation value to 0xbeaf
    // and calculate the checksum of the packet header.
    // Set 0x34-0x35 to this value.
    checksum = 48815;
    for (i = 0; i < Header.length; i++) {
        checksum += Header[i];
        checksum = checksum & 65535;
    }
    Header[40] = checksum & 255;
    Header[41] = checksum >> 8;

    // Append the payload
    Payload = hexStringToByte(UDPInstruction.substring(112));
    Packet = new Uint8Array(Header.length + Payload.length);
    Packet.set(Header);
    Packet.set(Payload, Header.length);

    // Set the checksum initialisation value to 0xbeaf
    // and calculate the checksum of the entire packet.
    // Set 0x20-0x21 to this value.
    checksum = 48815;
    for (i = 0; i < Packet.length; i++) {
        checksum += Packet[i];
        checksum = checksum & 65535;
    }
    Packet[32] = checksum & 255;
    Packet[33] = checksum >> 8;

    // Packet assembled, prepare to send to device
    Packet = byteToHexString(Packet);
    UDPInstruction = new Buffer(hex2bin(Packet));

    var client = dgram.createSocket('udp4');
    client.send(UDPInstruction, 0, UDPInstruction.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
        console.log('UDP message sent');
        client.close();
    });

}

exports.YAML = function() {
    return RMDevices;
}
