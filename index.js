const EventEmitter = require("events");
const dgram = require("dgram");
const crypto = require("crypto");
const packet = require("./lib/packet");

class PaperCup extends EventEmitter {
	constructor(udpSocket) {
		if(typeof udpSocket != undefined) {
			if(!(socket instanceof dgram.Socket)) {
				throw new TypeError("socket must be an instance of dgram.Socket");
			}
		}

		super();
		this.send = {};
		this.recv = {};
	}

	attach(socket) {
		if(!(socket instanceof dgram.Socket)) {
			throw new TypeError("socket must be an instance of dgram.Socket");
		}

		this.socket = socket;

		this.socket.on("message", (msg, sender) => {
			this.packet(msg, sender);
		});
	}

	bind() {
		this.attach(dgram.createSocket("udp4"));
		this.socket.bind(...arguments);
	}

	packet(rawPacket, sender) {
		if(!(rawPacket) instanceof Buffer) {
			throw new TypeError("rawPacket must be a buffer");
		}

		if(typeof sender.port != "number") {
			throw new TypeError("sender.port must be a number");
		}

		if(typeof sender.address != "string") {
			throw new TypeError("sender.address must be a string");
		}

		const { ack, last, id, chunk, data } = packet.decode(rawPacket);

		if(ack) {
			// send next packet
			if(this.send[id].recipient.address != sender.address || this.send[id].recipient.port != sender.port) {
				return;
			}

			const msg = this.send[id];

			msg.chunks[chunk].ack = true;

			let i;

			for(i = 0; i < msg.chunks.length && msg.chunks[i].ack == true; i++) {
				;;
			};

			if(msg.chunks[i]) {
				console.log("sending next chunk");
				const chunk = msg.chunks[i];

				this.socket.send(packet.encode({
					id,
					chunk: i,
					last: i == msg.chunks.length - 1,
					data: chunk.data
				}), msg.recipient.port, msg.recipient.address);
			} else {
				msg.callback();
				this.send[id] = undefined;
			}
		} else {
			// send ack

			if(!this.recv[id]) {
				this.recv[id] = {
					chunks: []
				};
			}

			this.recv[id].chunks[chunk] = data;

			this.socket.send(packet.encode({
				ack: true,
				id, chunk, last
			}), sender.port, sender.address);

			if(last) {
				const final = Buffer.concat(this.recv[id].chunks);
				this.emit("message", final);
			}
		}
	}

	message(data, recipient, callback = () => {}) {
		if(!(data instanceof Buffer)) {
			data = Buffer.from(data);
		}

		const hash = crypto.createHash("sha256");

		hash.update(data);
		hash.update(Date.now().toString());
		hash.update(crypto.randomBytes(16));

		const id = hash.digest().toString("base64");

		const msg = this.send[id] = {
			chunks: [],
			recipient,
			callback
		};

		// create chunks

		const totalChunks = parseInt(data.length / packet.maxDataSize) + 1;

		for(let i = 0; i < totalChunks; i++) {
			msg.chunks[i] = {
				data: data.slice(i * packet.maxDataSize, (i + 1) * packet.maxDataSize),
				ack: false
			};
		}

		this.socket.send(packet.encode({
			id,
			chunk: 0,
			data: msg.chunks[0].data,
			last: 0 == msg.chunks.length - 1
		}), recipient.port, recipient.address);
	}
}

module.exports = PaperCup;
