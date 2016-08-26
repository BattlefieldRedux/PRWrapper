
export class Flags {
    public static HEADERS: number = 1;
    public static PLAYERS: number = 2;
    public static TEAM: number = 4;
}


export class Player {
    public player_: string[];
    public score_: string[]
    public ping_:string[]
    public team_: string[]
    public deaths_: string[]
    public skill_: string[]
    public pid_: string[]
    public AIBot_: string[]
}

export class Server {
    headers: {
        hostname?:string,
        numplayers?:string,
        maxplayers?:string
    };
    players: Object;
    team: Object;
    timestamp: Uint8Array;
}

export class Message {
    public static MESSAGE_SIZE: number = 1400;
    public static TYPE_HEADERS: number = 0;
    public static TYPE_PLAYERS: number = 1;
    public static TYPE_TEAM: number = 2;

    private mPos: number;
    private mBuffer: Uint8Array;

    constructor(val: any) {
        this.mPos = 0
        // Works with both 'number' and 'Uint8Array'
        this.mBuffer = new Uint8Array(val);
    }


    public put(value: number): Message {
        this.mBuffer[this.mPos] = value;
        this.next();
        return this;
    }

    public putString(value: String): Message {
        for (var k = 0; k < value.length; k++) {
            this.put(value.charCodeAt(k));
        }

        return this;
    }


    public get(): number {
        let val = this.mBuffer[this.mPos];
        this.next();
        return val;

    }

    public getString(): string {
        let value: string = "";
        let char: number;

        while ((char = this.get()) != 0) {
            value += String.fromCharCode(char);
        }
        return value;
    }

    public skip(): Message {
        this.next();
        return this;
    }

    public peek(): number {
        return this.mBuffer[this.mPos];
    }


    public position(pos: number=undefined): any {
        if(pos!==undefined){
            this.mPos = pos;
            return this;
        }else{
            return this.mPos;
        }
       
    }

    public raw(): Uint8Array {
        return this.mBuffer;
    }

    public remaining(): number {
        return this.mBuffer.length - (this.mPos + 1);
    }


    public isLast(val): boolean {
        if (val !== undefined && val)
            this.mBuffer[14] |= 0x80;
        else if (val !== undefined)
            this.mBuffer[14] &= 0x7f;

        return (this.mBuffer[14] & 0x80) == 0x80;
    }


    public packet(val): number {
        if (val !== undefined) {
            // Save of this is last package or not before setting value
            let pac = this.mBuffer[14] & 0x80;
            pac |= val;
            this.mBuffer[14] = pac;
        }

        return this.mBuffer[14] & 0x7f;
    }

    private next() {
        if (this.mPos < this.mBuffer.length - 1)
            this.mPos++;
    }


    public toString = (): string => {

        let result: string = "";
        for (var k = 0; k < this.mPos + 1; k++) {
            result += ('0' + (this.mBuffer[k] & 0xFF).toString(16)).slice(-2);
        }
        return result;
    }



}