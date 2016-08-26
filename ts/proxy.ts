import {createSocket, Socket} from "dgram"
import {Encoder} from "./Encoder"
import {Decoder} from "./Decoder"
import {Server, Message, Flags, Player} from "./Model"
import ip = require("ip");
import "./Utils"

let MOCKED_PLAYERS = {
    "player_": [],
    "score_": [],
    "ping_": [],
    "team_": [],
    "deaths_": [],
    "pid_": [],
    "skill_": [],
    "AIBot_": [],
};

let PLAYERS = 100;

(function () {
    for (let k = 0; k < PLAYERS; k++) {
        MOCKED_PLAYERS["player_"].push(" Player_" + k);
        MOCKED_PLAYERS["score_"].push(k.toString());
        MOCKED_PLAYERS["ping_"].push("100");
        MOCKED_PLAYERS["team_"].push((k < 50) ? "1" : "2");
        MOCKED_PLAYERS["deaths_"].push("0");
        MOCKED_PLAYERS["skill_"].push("0");
        MOCKED_PLAYERS["pid_"].push(k.toString());
        MOCKED_PLAYERS["AIBot_"].push("0");
    }
})();



export class ProxyServer {
    private mPort: number;
    private mServer: Socket;
    private mIP: string = ip.address();

    static CHALLENGE_REQUEST = Buffer.from([0xfe, 0xfd, 0x09]);
    static QUERY_REQUEST = Buffer.from([0xfe, 0xfd, 0x00]);
    static LOOPBACK_IP: string = "127.0.0.1";


    constructor(port: number, networkIP: string = undefined) {
        this.mPort = port;
        this.mIP = networkIP === undefined ? ip.address() : networkIP;
    }

    public start() {
        if (this.mServer === undefined) {
            this.mServer = createSocket('udp4');
          
            this.mServer.on('message', function (message, remote) {
                this.onMessage(message, remote);
            }.bind(this));

            // server listening 0.0.0.0:41234
            this.mServer.bind(this.mPort, this.mIP);
            console.log(`Server is now listening on ${this.mIP}:${this.mPort}...`);
        } else {
            console.error("Server is already running.");
        }
    }


    private onMessage(request, remote) {
        //console.log("onMessage");
        console.log(request[0] + " " + request[1] + " " + request[2] + ": " + request.compareTo(ProxyServer.QUERY_REQUEST, 0, 3));

        if (request.compareTo(ProxyServer.QUERY_REQUEST, 0, 3)) {
            //console.log("Responding...");

            let server: Server = new Server();
            let nMessages = 0;
            let tMessages = -1;
            this.relay(request, remote, (reply) => {
                //console.log("Relay receiving a message...");
                nMessages++;
                if (Decoder.isLastMessage(reply))
                    tMessages = Decoder.getMessageNumber(reply);

                Decoder.decode(reply, server);

                console.log("nMessages: " + nMessages);
                console.log("tMessages: " + tMessages);
                if (nMessages - 1 == tMessages) {
                    let challenge: Buffer = Buffer.alloc(5);
                    request.copy(challenge, 0, 3, 7);

                    server.headers.hostname = "Derp";
                    server.headers.numplayers = PLAYERS.toString();
                    server.headers.maxplayers = "100";
                    server.players = MOCKED_PLAYERS;

                    let encoder: Encoder = new Encoder(challenge, server);
                    let messages = encoder.encode(Flags.HEADERS + Flags.PLAYERS + Flags.TEAM);

                    for (let k in messages) {
                        let buffer: Buffer = Buffer.from(messages[k].raw().slice(0, messages[k].position() + 1));
                        this.sendTo(buffer, remote);
                    }
                }
            });
        } else {
            this.relay(request, remote);
        }
    }

    private relay(message, remote, callback = undefined) {
        //console.log("relay");


        var relay = createSocket('udp4');
        let self = this;
        if (callback === undefined) {
            //console.log("Default relay call")
            callback = function (gMessage) {
                self.sendTo(gMessage, remote);
            };
        }

        relay.on('message', callback);

        //console.log("Relay sending a message...");
        relay.send(message, 0, message.length, this.mPort, ProxyServer.LOOPBACK_IP, (err) => {
            if (err) {
                console.error(err);
                relay.close();
            }
        });
    }

    private sendTo(message: Buffer, target) {
        //console.log("sendTo");
        this.mServer.send(message, 0, message.length, target.port, target.address);
    }
}