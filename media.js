// const mediasoup = require('mediasoup');
const RoomrtcServer = require('roomrtc');
const logger = require('./logger')('Media Room');

function safeCb(cb) {
    if (typeof cb === 'function') {
        return cb;
    } else {
        return function () {};
    }
}

/**
 * MediaRoom
 */
module.exports = class MediaRoom extends RoomrtcServer {

    constructor(options) {
        super(options);

        this.logger = logger;

        // setup events listener
        this.on('connection', this.onClientConnect.bind(this));
        this.on('leave', this.onClientLeave.bind(this));
        this.on('join', this.onClientJoin.bind(this));

        this.on('message', this.onClientMessage.bind(this));
        this.on('command', this.onClientCommand.bind(this));
        // 
        this.logger.info('Config info ', this.config);
    }

    onClientConnect(client) {
        // send back welcome message
        this.logger.info('New client connect: ', client.id);
        client.send({
            type: 'welcome',
            message: 'Enjoy video conferencing !'
        });
    }

    onClientLeave(client) {
        this.logger.info('A client leave: ', client.id);

    }

    onClientJoin(client, room) {
        this.logger.info('Client request to join room: ', client.id, room);

    }

    onClientMessage(client, msg) {
        this.logger.info('Client send a message: ', client.id, msg && msg.type);

    }

    onClientCommand(client, cmd) {
        this.logger.info('Client send a command: ', client.id, cmd && cmd.type);

    }

}