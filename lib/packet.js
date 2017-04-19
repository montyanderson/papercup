const udpPacketSize = 508;
const headerSize = 1 + 4 + 32;
const dataSize = udpPacketSize - headerSize;

const version = 1;

const packet = module.exports = {
	encode(args) {
		if(typeof args != "object") {
			throw new TypeError("args must be an object");
		}

		const ack = args.ack || false;
		const last = args.last || false;
		let id = args.id;
		const chunk = args.chunk;
		const data = args.data || Buffer.alloc(0);

		if(typeof ack != "boolean") {
			throw new TypeError("ack must be a boolean");
		}

		if(typeof last != "boolean") {
			throw new TypeError("last must be a boolean");
		}

		if(typeof id != "string") {
			throw new TypeError("id must be a string");
		}

		try {
			id = Buffer.from(id, "base64");
		}	catch(err) {
			throw new TypeError("id must be base64 encoded");
		}

		if(id.length != 32) {
			throw new TypeError("id must be exactly 32 bytes long");
		}

		if(typeof chunk != "number") {
			throw new TypeError("chunk must be a number");
		}

		if(!(data instanceof Buffer)) {
			throw new TypeError("data must be am")
		}

		if(data.length > dataSize) {
			throw new RangeError("data.length cannot be more than packet.maxDataSize");
		}

		const packet = Buffer.alloc(headerSize + data.length);

		packet.writeUInt8(version, 0);
		packet.writeUInt32BE(+ack | +last << 1 | chunk << 2, 1);
		id.copy(packet, 5, 0, 32);

		data.copy(packet, headerSize, 0);

		return packet;
	},

	decode(packet) {
		if(!(packet instanceof Buffer)) {
			throw new TypeError("packet must be a Buffer");
		}

		const ack = Boolean(packet.readUInt32BE(1) & 1);
		const last = Boolean((packet.readUInt32BE(1) >> 1) & 1);
		const chunk = packet.readUInt32BE(1) >> 2;
		const id = packet.slice(5, 5 + 32).toString("base64");
		const data = packet.slice(headerSize);

		return { ack, last, chunk, id, data };
	}
};

packet.maxDataSize = dataSize;
