# RoomRTC Media Server

A simple media server for RoomRTC

# Run roomrtc media as your own server

The program requires the following dependencies (easy to install using `npm`)

* [roomrtc](https://github.com/vunb/roomrtc) - Framework enables quick development of WebRTC
* [mediasoup](https://github.com/ibc/mediasoup) - Cutting Edge WebRTC Video Conferencing

Follow these steps to run the server:

* Clone repo: `git clone https://github.com/roomrtc/mediaserver.git roomrtc-media-server`
* Change dir: `cd roomrtc-media-server`
* Install deps: `npm install`
* Start server: `npm start`
* Open browser: `http://localhost:8123/?myroom`

Install via npm:

```bash
npm install @roomrtc/mediaserver
```

Prior to that, ensure your host satisfies the following **requirements**:

* Node.js >= `v6.9.1`
* POSIX based operating system (Windows not yet supported)
* Python 2 (`python2` or `python` command must point to the Python 2 executable)
* `make`
* `gcc` and `g++`, or `clang`, with C++11 support

*NOTE*: In Debian and Ubuntu install the `build-essential` package. It includes both make and gcc/g++.

# License

MIT
