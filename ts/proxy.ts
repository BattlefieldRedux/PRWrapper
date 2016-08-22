import {createSocket, Socket} from "dgram"
import {Encoder} from "./Encoder"
import {Decoder} from "./Decoder"
import {Server, Message, Flags, Player} from "./Model"
import "./Utils"

let MOCKED_PLAYERS = {
    "player_": ["Player1", "Player2"],
    "score_": ["124", "200"],
    "ping_": ["99", "99"],
    "team_": ["1", "2"],
    "deaths_": ["0", "0"],
    "skill_": ["1", "2"],
    "pid_": ["1", "2"],
    "AIBot_": ["0", "0"],
} ;

export class ProxyServer {
    private mPort: number;
    private mServer: Socket;

    static CHALLENGE_REQUEST = Buffer.from([0xfe, 0xfd, 0x09]);
    static QUERY_REQUEST = Buffer.from([0xfe, 0xfd, 0x00]);
    static LOOPBACK_IP: string = "127.0.0.1";
    static PUBLIC_IP: string = "192.168.1.186";


    constructor(port: number) {
        this.mPort = port;
    }

    public start() {
        if (this.mServer === undefined) {
            this.mServer = createSocket('udp4');
            let self = this;
            this.mServer.on('message', function (message, remote) {
                self.onMessage(message, remote);
            });

            // server listening 0.0.0.0:41234
            this.mServer.bind(this.mPort, ProxyServer.PUBLIC_IP);
            console.log(`Server is now listening on ${ProxyServer.PUBLIC_IP}:${this.mPort}...`);
        } else {
            console.error("Server is already running.");
        }
    }


    private onMessage(request, remote) {
        //console.log("onMessage");
        console.log(request[0]+" "+request[1]+" "+request[2]+": "+request.compareTo(ProxyServer.QUERY_REQUEST, 0, 3));

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
                    var challenge = request.toString('hex').substring(6, 14);
                    server.headers.hostname = "Derp";
                    server.players = MOCKED_PLAYERS;
                    let encoder: Encoder = new Encoder(challenge, server);
                    let messages = encoder.encode(Flags.HEADERS + Flags.PLAYERS + Flags.TEAM);

                    for (let k in messages) {
                        console.log("Replying...");
                        let buffer: Buffer = Buffer.from(messages[k].raw());
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