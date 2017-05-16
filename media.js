const config = require('config');
const mediasoup = require('mediasoup');
const RoomrtcServer = require('roomrtc');

const Peer = require('./peer');
const logger = require('./logger')('Media Room');

const MAX_BITRATE = config.get('roomrtc.maxBitrate') || 3000000;
const MIN_BITRATE = Math.min(50000, MAX_BITRATE);
const BITRATE_FACTOR = 0.75;

/**
 * MediaRoom
 */
module.exports = class MediaRoom extends RoomrtcServer {

    constructor(options) {
        super(options);

        this.logger = logger;
        this.mediaServer = null;
        this.mediaRooms = new Map();
        this.peers = {};

        // setup events listener
        this.on('connection', this.onClientConnect.bind(this));
        this.on('leave', this.onClientLeave.bind(this));
        this.on('join', this.onClientJoin.bind(this));

        this.on('message', this.onClientMessage.bind(this));
        this.on('command', this.onClientCommand.bind(this));
        // 
        this.logger.info('Config info ', this.config);

        if (this.config.autoInitServer) {
            let settings = config.get('mediaServerSettings');
            // init media server
            this.mediaServer = mediasoup.Server(settings);
            this.mediaServer.on('newroom', mediaRoom => {
                // A new room is created
                this.logger.info('A new media room is created');
            });
        }
    }

    /**
     * Get room by name
     * @param {String} name Name of the room
     */
    getMediaRoom(name) {
        return this.mediaRooms.get(name);
    }

    /**
     * Set media room by name
     * @param {String} name Name of the room
     * @param {MediaRoom} mediaRoom 
     */
    setMediaRoom(name, mediaRoom) {
        this.mediaRooms.set(name, mediaRoom);
        return mediaRoom;
    }

    /**
     * Get peer by id
     * @param {String} id 
     */
    getPeer(id) {
        this.logger.info('getPeer, id:', id);
        return this.peers[id];
    }

    /**
     * Set peer by id
     * @param {String} id 
     * @param {MediaPeer} peer 
     */
    setPeer(id, peer) {
        this.logger.info('setPeer, id:', id);
        this.peers[id] = peer;
        return peer;
    }

    /**
     * Create peer from Socket
     * @param {MediaRoom} mediaRoom 
     * @param {Socket} socket
     */
    createPeer(mediaRoom, socket) {
        let id = socket.id;
        let client = this.getPeer(id);
        this.cleanPeer(client);

        let mediaPeer = mediaRoom.Peer(id);
        let peer = new Peer({
            mediaRoom: mediaRoom,
            mediaPeer: mediaPeer,
            socket: socket
        });
        return peer;
    }

    cleanPeer(peer) {
        if (!peer) {
            return;
        }

        // Clean up
        this.logger.info('Close peer connection', peer.id);
        peer.close();

        // remove from properties
        delete this.peers[peer.id];
    }

    /**
     * Process client on connect
     * @param {Socket} client 
     */
    onClientConnect(client) {
        // send back welcome message
        this.logger.info('New client connect: ', client.id);
        client.send({
            type: 'welcome',
            message: 'Enjoy video conferencing !'
        });
    }

    /**
     * Process client on leave
     * @param {Socket} client 
     */
    onClientLeave(client) {
        this.logger.info('A client leave: ', client.id);

        let pid = client.id;
        let peer = this.getPeer(pid);
        this.cleanPeer(peer);
    }

    /**
     * Process client on join
     * @param {String} roomName 
     * @param {Socket} client 
     */
    onClientJoin(roomName, client) {
        this.logger.info('Client request to join room: ', client.id, roomName);

        // Create new peer and join room
        return Promise.resolve(1)
            .then(() => {
                let mediaRoom = this.getMediaRoom(roomName);
                if (!mediaRoom) {
                    let options = config.get('roomOptions');
                    // create new media room
                    return this.mediaServer.createRoom(options)
                        .then(roomCreated => {
                            // this.logger.info('Create room success: ', roomCreated);
                            this.setMediaRoom(roomName, roomCreated);
                            return roomCreated;
                        })
                        .then((mediaRoom) => {
                            process.nextTick(() =>
                            {
                                mediaRoom.on('newpeer', (peer) =>
                                {
                                    this.logger.info(`New peer created --> this._updateMaxBitrate(${roomName})`)
                                    this._updateMaxBitrate(mediaRoom);

                                    peer.on('close', () =>
                                    {
                                        this.logger.info(`peer leave: _updateMaxBitrate(${roomName})`);
                                        this._updateMaxBitrate(mediaRoom);
                                    });
                                });
                            });
                            return mediaRoom;
                        })
                } else {
                    // this.logger.info('Room created already: ', mediaRoom);
                    return mediaRoom;
                }
            })
            .then(mediaRoom => {
                let capabilities = config.get('peerCapabilities');
                let peer = this.createPeer(mediaRoom, client);
                // peer.mediaPeer.setCapabilities(capabilities);
                this.setPeer(client.id, peer);
                client.emit('ready', 'join me');
            })
            .catch(err => {
                this.logger.error('Create mediaRoom error', err);
            });
    }

    /**
     * Process message of client on receive
     * @param {Socket} client 
     * @param {Object} msg 
     */
    onClientMessage(client, msg) {
        this.logger.info('Client send a message: ', client.id, msg && msg.type);

        let peer = this.getPeer(client.id);
        peer.processMessage(msg);
    }

    /**
     * Process command of client on receive
     * @param {Socket} client 
     * @param {Object} cmd 
     */
    onClientCommand(client, cmd) {
        this.logger.info('Client send a command: ', client.id, cmd && cmd.type);

    }

    /**
     * Private methods
     */
    _updateMaxBitrate(mediaRoom) {
        if (!mediaRoom || mediaRoom.closed) return;

        this.logger.info('PrevMaxBitrate: ', mediaRoom._maxBitrate);
        let numPeers = mediaRoom.peers.length;
        let previousMaxBitrate = mediaRoom._maxBitrate;
        let newMaxBitrate;

        if (numPeers <= 2) {
            newMaxBitrate = MAX_BITRATE;
        } else {
            newMaxBitrate = Math.round(MAX_BITRATE / ((numPeers - 1) * BITRATE_FACTOR));
            if (newMaxBitrate < MIN_BITRATE) {
                newMaxBitrate = MIN_BITRATE;
            }
        }

        if (newMaxBitrate === previousMaxBitrate) return;

        // for each peer in room
        for (let peer of mediaRoom.peers) {
            if (!peer.capabilities || peer.closed) continue;

            for (let transport of peer.transports) {
                if (transport.closed) continue;

                transport.setMaxBitrate(newMaxBitrate);
            }
        }

        this.logger.info(`_updateMaxBitrate() [num peers:${numPeers}, before:${Math.round(previousMaxBitrate / 1000)}kbps, now:${Math.round(newMaxBitrate / 1000)}kbps]`);

        mediaRoom._maxBitrate = newMaxBitrate;
    }

}