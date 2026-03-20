import { RpcTransport } from "capnweb";

export class HybernationTransport implements RpcTransport {
	constructor(websocket: WebSocket) {
		this.#webSocket = websocket;
	}

	#webSocket: WebSocket;
	#receiveResolver?: (message: string) => void;
	#receiveRejecter?: (err: any) => void;
	#receiveQueue: string[] = [];
	#error?: any;

	onMessage(message: string | ArrayBuffer) {
		if (this.#error) {
			// Ignore further messages.
		} else if (typeof message === "string") {
			if (this.#receiveResolver) {
				this.#receiveResolver(message);
				this.#receiveResolver = undefined;
				this.#receiveRejecter = undefined;
			} else {
				this.#receiveQueue.push(message);
			}
		} else {
			this.#receivedError(new TypeError("Received non-string message from WebSocket."));
		}
	}

	onClose(code: number, reason: string) {
		this.#receivedError(new Error(`Peer closed WebSocket: ${code} ${reason}`));
	}

	onError(error: unknown) {
		this.#receivedError(error);
	}

	send(message: string): Promise<void> {
		this.#webSocket.send(message);
		return Promise.resolve();
	}

	receive(): Promise<string> {
		if (this.#receiveQueue.length > 0) {
			return Promise.resolve(this.#receiveQueue.shift()!);
		} else if (this.#error) {
			throw this.#error;
		} else {
			return new Promise<string>((resolve, reject) => {
				this.#receiveResolver = resolve;
				this.#receiveRejecter = reject;
			});
		}
	}

	abort?(reason: any): void {
		let message: string;
		if (reason instanceof Error) {
			message = reason.message;
		} else {
			message = `${reason}`;
		}
		this.#webSocket.close(3000, message);

		if (!this.#error) {
			this.#error = reason;
			// No need to call receiveRejecter(); RPC implementation will stop listening anyway.
		}
	}

	#receivedError(reason: any) {
		if (!this.#error) {
			this.#error = reason;
			if (this.#receiveRejecter) {
				this.#receiveRejecter(reason);
				this.#receiveResolver = undefined;
				this.#receiveRejecter = undefined;
			}
		}
	}
}
