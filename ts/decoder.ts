import {Message, Server, Flags} from "./Model";


export class Decoder {

    public static decode(rawMessage: Uint8Array, server: Server) {
        let message = new Message(rawMessage);

        if (server === undefined)
            server = new Server();

        Decoder.parseMessageHeader(message, server);

        let type: number;
        while (message.remaining() > 0) {
            type = message.get();
            switch (type) {
                case Message.TYPE_HEADERS:
                    Decoder.parseHeaders(message, server);
                    break;

                case Message.TYPE_PLAYERS:
                    Decoder.parsePlayers(message, server);
                    break;

                case Message.TYPE_TEAM:
                    Decoder.parseTeam(message, server);
                    break;

                default:
                    throw Error("Incomplete switch statement, got: " + type);
            }
        }
    }


    private static parseArray(message: Message, array: Object) {

        while (message.peek() != 0) {
            let field = message.getString();
            let offset = message.get();

            if (array[field] === undefined)
                array[field] = [];

            while (message.peek() != 0) {
                let value = message.getString();
                array[field][offset++] = value;
            }
            message.skip();
        }
    }


    private static parseTeam(message: Message, server: Server) {
        if (server.team === undefined)
            server.team = {};

        Decoder.parseArray(message, server.team);
        message.skip();
    }

    private static parsePlayers(message: Message, server: Server) {
        if (server.players === undefined)
            server.players = {};
        Decoder.parseArray(message, server.players);
        message.skip();
    }

    private static parseHeaders(message: Message, server: Server) {
        if (server.headers === undefined)
            server.headers = {};

        while (message.peek() != 0) {
            let field = message.getString();
            let value = message.getString();

            server.headers[field] = value;
        }
        message.skip();
    }


    private static parseMessageHeader(message: Message, server: Server) {
        // Initial \00
        message.skip();

        // Server timestamp (not a real timestamp just 4 bytes of "data")
        server.timestamp = new Uint8Array(4);
        server.timestamp[0] = message.get();
        server.timestamp[1] = message.get();
        server.timestamp[2] = message.get();
        server.timestamp[3] = message.get();

        // Ignore 'splitnum'
        message.getString();

        // Ignore number of message
        message.skip();
    }

    public static getMessageNumber(rawMessage: Uint8Array): number {
        // Apply a mask to ignore the most left bit
        return rawMessage[14] & 0x7f;
    }

    public static isLastMessage(rawMessage: Uint8Array): Boolean {
        // Apply a mask to only care about the last bit
        return (rawMessage[14] & 0x80) == 0x80;
    }
}