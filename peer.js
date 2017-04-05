const mediasoup = require('mediasoup');
const RTCPeerConnection = mediasoup.webrtc.RTCPeerConnection;
const RTCSessionDescription = mediasoup.webrtc.RTCSessionDescription;
/**
 * Media Peer connection
 */
module.exports = class Peer {

    constructor(options) {
        // set peer required options.
        this.options = options || {};
        this.mediaRoom = options['mediaRoom'];
        this.mediaPeer = options['mediaPeer'];
        this.socket = options['socket'];
        this.pc = null;

        // config log
        this.logger = require('./logger')(`Peer-${this.id}`);
        this.close = this.mediaPeer.close.bind(this.mediaPeer);
    }

    get id() {
        return this.socket && this.socket.id;
    }

    /**
     * Process RoomRTC message
     * @param {Object} msg
     */
    processMessage(msg) {
        this.logger.info('Preparing process msg, type:', msg.type);
        if (msg.type === 'offer') {
            this._handleMsgOffer(msg);
        } else if (msg.type === 'answer') {
            this._handleMsgAnswer(msg);
        } else if (msg.type === 'bye') {
            this.logger.info('Bye from client ?')
        } else {
            this.logger.info('Unknow message:', msg.type, msg);
        }
    }

    sendSDPReOffer(description) {
        let pid = this.id;
        let sid = socket.sid || Date.now().toString();
        let msg = {
            from: pid,
            sid: sid,
            type: description.type,
            payload: {
                type: description.type,
                sdp: description.sdp
            }
        }

        // send msg back to client
        // this.socket.send(msg);
        this.socket.emit('message', msg);
    }

    sendSDPOffer(pc) {
        return pc.createOffer()
            .then(desc => {
                this.logger.info('pc.setLocalDescription(desc); ....');
                return pc.setLocalDescription(desc);
            })
            .then(() => {
                this.logger.info('re-offer to id=', id);
                this.sendSDPReOffer(pc.localDescription);
            })
            .catch(err => {
                this.loger.error('error handling SDP re-offer to participant: ', err);
            });
    }

    _handleMsgOffer(msg) {
        let pid = this.id;
        let options = {
            usePlanB: msg.planb || true
        }

        let desc = new RTCSessionDescription(msg.payload);
        let pc = new RTCPeerConnection(this.mediaRoom, pid, options);

        pc.on('negotiationneeded', () => {
            this.logger.info('negotiationneeded sendSdpOffer back:', pid);
            this.sendSDPOffer(pc);
        });

        pc.setRemoteDescription(desc)
            .then(result => {
                this.logger.info('pc.setRemoteDescription ok, from:', msg.from, result);
                return pc.createAnswer();
            })
            .then(desc => {
                return pc.setLocalDescription(desc);
            })
            .then(() => {
                this.sendSDPReOffer(pc.localDescription);
            })
            .catch(err => {
                this.logger.error("error handling SDP offer from participant: %s", err);
            });

        // save peer connection
        this.pc = pc;
    }

    _handleMsgAnswer(msg) {
        let pid = this.id;
        if (!this.pc) {
            return this.logger.warn('Peer connection not found. id=', pid);
        }

        // Create sdp answer
        let desc = new RTCSessionDescription(msg.payload);
        this.pc.setRemoteDescription(desc)
            .then(() => {
                this.logger.info('setRemoteDescription for answer OK id=', pid);
            })
            .catch(err => {
                this.logger.error('setRemoteDescription for Answer error: ', err);
            })
    }
}