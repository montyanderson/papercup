const udpPacketSize = 508;
const headerSize = 1 + 4 + 32;
const dataSize = udpPacketSize - headerSize;

const version = 1;

const packet = module.exports = {
	encode(obj) {
		const ack = obj.ack || 0;
		const last = obj.last || 0;
		const id = obj.id;
		const chunk = obj.chunk;
		const data = obj.data || Buffer.alloc(0);

		if(data.length > dataSize) {
			throw new RangeError("Data.length must be less than packet.maxDataSize");
		}

		const packet = Buffer.alloc(headerSize + data.length);

		packet.writeUInt8(version, 0);
		packet.writeUInt32BE(+ack | +last << 1 | chunk << 2, 1);
		Buffer.from(id, "base64").copy(packet, 5, 0, 32);

		data.copy(packet, headerSize, 0);

		return packet;
	},

	decode(packet) {
		const ack = Boolean(packet.readUInt32BE(1) & 1);
		const last = Boolean((packet.readUInt32BE(1) >> 1) & 1);
		const chunk = packet.readUInt32BE(1) >> 2;
		const id = packet.slice(5, 5 + 32).toString("base64");
		const data = packet.slice(headerSize);

		return { ack, last, chunk, id, data };
	}
};

packet.maxDataSize = dataSize;
