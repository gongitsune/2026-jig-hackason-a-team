import { RoomStatus } from "@ichibun/shared/api";

export class RoomStatusRepository {
	private storage: DurableObjectStorage;

	constructor(storage: DurableObjectStorage) {
		this.storage = storage;
	}

	public async updateStatus(status: RoomStatus): Promise<void> {
		await this.storage.put("status", status);
	}

	public async getStatus(): Promise<RoomStatus | null> {
		const status = await this.storage.get("status");
		if (status) {
			return status as RoomStatus;
		}

		return null;
	}
}
