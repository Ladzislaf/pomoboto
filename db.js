import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class DataBase {
	constructor() {
		this.userSettings = {
			focusPeriod: 'focusPeriod',
			breakPeriod: 'breakPeriod',
		};
	}

	async createNewUser(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (!isUserExists) {
			try {
				await prisma.user.create({
					data: {
						id: `${userId}`,
					},
				});
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} is already exists.[createNewUser]`);
		}
	}

	async updateUserSettings(userId, fieldToUpdate, newValue) {
		if (!(fieldToUpdate in this.userSettings)) {
			console.log(`User setting: ${fieldToUpdate} was not found.[updateUserSettings]`);
		}
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				await prisma.user.update({
					where: {
						id: `${userId}`,
					},
					data: {
						[fieldToUpdate]: Number(newValue),
					},
				});
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[updateUserSettings]`);
		}
	}

	async isUserExists(userId) {
		try {
			const findUser = await prisma.user.findUnique({ where: { id: `${userId}` } });
			return Boolean(findUser);
		} catch (error) {
			console.error(error);
		}
	}

	async getUserSettings(userId) {
		const isUserExists = await this.isUserExists(userId);
		if (isUserExists) {
			try {
				const foundUser = await prisma.user.findUnique({
					where: {
						id: `${userId}`,
					},
				});
				return foundUser;
			} catch (error) {
				console.error(error);
			}
		} else {
			console.log(`User with id: ${userId} was not found.[getUserSettings]`);
		}
	}
}

export default new DataBase();
