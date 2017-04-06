var adapter = require('webrtc-adapter');
var test = require('tape');

test('sets RTCPeerConnection', function (t) {
    t.plan(1);
    t.equal(typeof RTCPeerConnection, 'function');
});