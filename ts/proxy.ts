import {createSocket, Socket} from "dgram"
import {Encoder} from "./Encoder"
import {Decoder} from "./Decoder"
import {Server, Message, Flags, Player} from "./Model"
import ip = require("ip");
import "./Utils"

export class ProxyServer {
    static CHALLENGE_REQUEST = Buffer.from([0xfe, 0xfd, 0x09]);
    static QUERY_COMPLETE_REQUEST = Buffer.from([0xfe, 0xfd, 0x00, 0x22, 0x22, 0x22, 0x22, 0xff, 0xff, 0xff, 0x01]);
    static QUERY_REQUEST = Buffer.from([0xfe, 0xfd, 0x00]);

    static LOOPBACK_IP: string = "127.0.0.1";

    // Socket that listens for client requests
    private mClientSocket: Socket;
    // Socket that listens for gameServer requests
    private mServerSocket: Socket;

    private mPort: number;
    private mReportingPort: number;
    private mIP: string;

    // This is where we'll store the real (==complete) player list
    private mServerInfo: Server;

    constructor(clientPort: number, serverPort: number, networkIP: string = undefined) {
        this.mServerInfo = new Server();
        this.mPort = clientPort;
        this.mReportingPort = serverPort;
        this.mIP = networkIP === undefined ? ip.address() : networkIP;
    }

    public start() {
        // Start gameServer socket
        if (this.mServerSocket === undefined) {
            this.mServerSocket = createSocket('udp4');

            this.mServerSocket.on('message', function (message, remote) {
                this.onGameReporting(message, remote);
            }.bind(this));


            this.mServerSocket.bind(this.mReportingPort, '127.0.0.1');

            console.log(`Server is now listening game server on 127.0.0.1':${this.mReportingPort}...`);
        } else {
            console.error("Server is already running.");
        }

        // Start client socket
        if (this.mClientSocket === undefined) {
            this.mClientSocket = createSocket('udp4');

            this.mClientSocket.on('message', function (message, remote) {
                this.onMessage(message, remote);
            }.bind(this));

            this.mClientSocket.bind(this.mPort, this.mIP);

            console.log(`Server is now listening clients on ${this.mIP}:${this.mPort}...`);
        } else {
            console.error("Server is already running.");
        }


    }



    private onGameReporting(message, remote) {
        // Reset
        this.mServerInfo = new Server();

        // Update player list
        Decoder.decode(message, this.mServerInfo, true);

    }

    private onMessage(request, remote) {

        console.log(request[0] + " " + request[1] + " " + request[2] + ": " + request.compareTo(ProxyServer.QUERY_REQUEST, 0, 3));

        if (request.compareTo(ProxyServer.QUERY_REQUEST, 0, 3)) {
            // Get client challenge 
            let challenge: Buffer = Buffer.alloc(5);
            request.copy(challenge, 0, 3, 7);

            let nMessages = 0;
            let tMessages = -1;
            let serverInfo: Server = new Server();

            // Relay request to server
            this.relay(request, function (gameServerReply) {

                nMessages++;
                if (Decoder.isLastMessage(gameServerReply))
                    tMessages = Decoder.getMessageNumber(gameServerReply);

                // update local information about server
                Decoder.decode(gameServerReply, serverInfo);

                // If local information is complete...
                if (nMessages - 1 == tMessages) {
                    // ... replace the player information w/ the correct one
                    serverInfo.players = this.mServerInfo.players;

                    // Encode message 
                    let encoder: Encoder = new Encoder(challenge, serverInfo);
                    let messages = encoder.encode(Flags.HEADERS + Flags.PLAYERS + Flags.TEAM);

                    // Send info to client
                    for (let k in messages) {
                        let buffer: Buffer = Buffer.from(messages[k].raw().slice(0, messages[k].position() + 1));
                        this.sendTo(buffer, remote);
                    }
                }
            }.bind(this));
        } else {
            // Relaying all other messages GameServer and returns directly to client 
            this.relay(request, function (gMessage) {
                this.sendTo(gMessage, remote);
            }.bind(this));
        }
    }

    /**
     * Sends the given message to GameServer
     */
    private relay(message, callback) {
        var relay = createSocket('udp4');
        let self = this;

        // Relay what the server replies
        relay.on('message', callback);

        // Send the given message to Server
        relay.send(message, 0, message.length, this.mPort, ProxyServer.LOOPBACK_IP, (err) => {
            if (err) {
                console.error(err);
                relay.close();
            }
        });
    }

    private sendTo(message: Buffer, target) {
        this.mClientSocket.send(message, 0, message.length, target.port, target.address);
    }
}