import {Message, Server, Flags} from "./Model";
import {Util} from "./Utils";


export class Encoder {

    private mMessage: Message;
    private mMessages: Message[];
    private mTimeStamp: Uint8Array;
    private mServer: Server;

    public constructor(timestamp: Uint8Array, server: Server) {
        this.mTimeStamp = timestamp;
        this.mServer = server;
        this.mMessages = [];
        this.mMessage = undefined;
    }

    public encode(flags: number): Message[] {
        this.newMessage();

        if ((flags & Flags.HEADERS) == Flags.HEADERS)
            this.encodeServerHeaders();

        if ((flags & Flags.PLAYERS) == Flags.PLAYERS)
            this.encodePlayers();

        if ((flags & Flags.TEAM) == Flags.TEAM)
            this.encodeTeam();

        this.mMessage.isLast(true);
        return this.mMessages;
    }

    private newMessage() {
        if (this.mMessage !== undefined && this.mMessage != null) {
            this.mMessage
                .position(Message.MESSAGE_SIZE - 1)
                .put(0);
        }
        this.mMessage = new Message(Message.MESSAGE_SIZE);
        this.mMessages.push(this.mMessage);
        this.initMessage();
    }

    private encodeServerHeaders() {
        this.mMessage.put(Message.TYPE_HEADERS);
        for (var field in this.mServer.headers) {
            if (this.mMessage.remaining() == 0) {
                this.newMessage();
                this.mMessage
                    .put(Message.TYPE_HEADERS);
            }

            this.mMessage
                .putString(field)
                .put(0)
                .putString(this.mServer.headers[field])
                .put(0);
        }
        this.mMessage.put(0);
    }

    private encodePlayers() {

        this.mMessage.put(Message.TYPE_PLAYERS);

        for (let field in this.mServer.players)
            this.encodeArray(this.mServer.players, field, Message.TYPE_PLAYERS);

        this.mMessage.put(0);
    }

    private encodeArray(array: Object[], field: string, type: number) {
        this.mMessage
            .putString(field)
            .put(0)
            .put(0); // Offset of this array

        for (let k = 0; k < array[field].length; k++) {
            let enoughtSpace = this.mMessage.remaining() - array[field][k].length;

            // Write anyways
            this.mMessage
                .putString(array[field][k])
                .put(0);

            if (enoughtSpace <= 0) {
                this.newMessage();
                this.mMessage
                    .put(type)
                    .putString(field)
                    .put(0)
                    .put(k);  // Offset of this array
                // Write again 
                this.mMessage
                    .putString(array[field][k])
                    .put(0);
            }


        }
        this.mMessage.put(0);
    }



    private encodeTeam() {
        this.mMessage.put(Message.TYPE_TEAM);

        for (let field in this.mServer.team)
            this.encodeArray(this.mServer.team, field, Message.TYPE_TEAM);
        this.mMessage.put(0);

    }

    private initMessage() {
        // Confirm position is at zero
        this.mMessage
            .position(0)
            .put(0);

        // TimeStamp Reply
        this.mMessage
            .put(this.mTimeStamp[0])
            .put(this.mTimeStamp[1])
            .put(this.mTimeStamp[2])
            .put(this.mTimeStamp[3]);

        //SplitNum
        this.mMessage
            .putString("splitnum")
            .put(0);

        // Number of message
        this.mMessage.put(this.mMessages.length - 1);

    }
}