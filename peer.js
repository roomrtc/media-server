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

        // field members
        this.mediaRoom = this.options['mediaRoom'];
        this.mediaPeer = this.options['mediaPeer'];
        this.socket = this.options['socket'];
        this.pc = null;

        // default config
        this.config = {
            peerConnectionOptions: {
                peer: this.mediaPeer,
                usePlanB: true
            }
        }

        // override default config
        for (let opt in this.config) {
            if (this.options.hasOwnProperty(opt)) {
                this.config[opt] = this.options[opt];
            }
        }

        // config log
        this.logger = require('./logger')(`Peer ${this.id}`);
        this.close = this.mediaPeer.close.bind(this.mediaPeer);

        this.createPeerConnection(this.config.peerConnectionOptions);
    }

    get id() {
        return this.socket && this.socket.id;
    }

    createPeerConnection(options) {
        this.pc = new RTCPeerConnection(options);
        return this.pc;
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
        } else if (/^ice/.test(msg.type)) {
            // this.logger.info('Do not process ice message', msg.type);
        } else {
            this.logger.info('Unknow message:', msg.type, msg);
        }
    }

    sendSdpToPeer(description) {
        let pid = this.id;
        let sid = this.socket.sid || Date.now().toString();
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

    sendSdpOffer(options) {
        return this.pc.createOffer(options)
            .then(desc => {
                this.logger.info('pc.setLocalDescription(desc); ....');
                return this.pc.setLocalDescription(desc);
            })
            .then(() => {
                this.logger.info('Preparing sendSdpOffer to peer');
                this.sendSdpToPeer(this.pc.localDescription);
            })
            .catch(err => {
                this.logger.error('sendSdpToPeer error:', err);
            });
    }

    _handleMsgOffer(msg) {

        this.pc.on('negotiationneeded', () => {
            this.logger.info('negotiationneeded send SDP re-offer:', this.id);
            this.sendSdpOffer();
        });

        // Participant is required to join the mediaRoom by providing a capabilities SDP.
        return this.pc.setCapabilities(msg.payload.sdp)
            .then(() => {
                this.logger.info('pc.setCapabilities(sdp) ok');
                this.sendSdpOffer({
                    offerToReceiveAudio: 1,
                    offerToReceiveVideo: 1
                });
            })
            .catch(err => {
                this.logger.error('_handleMsgOffer, pc.setCapabilities error:', err);
            });
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