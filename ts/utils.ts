


export class Util {
    public static toHexString(byteArray) {
        return byteArray.map(function (byte) {
            return ('0' + (byte & 0xFF).toString(16)).slice(-2);
        }).join('')
    }
}

(function () {
    Buffer.prototype['compareTo'] = function (buffer: Buffer, start: number, length: number) {
        for (let k = start; k < start + length; k++) {
            if (this[k] != buffer[k])
                return false;
        }
        return true;
    };
})();