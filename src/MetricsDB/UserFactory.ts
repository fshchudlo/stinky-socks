import { User } from "./entities/User";
import { MetricsDB } from "./MetricsDB";
import { Repository } from "typeorm";
import { createCache } from "cache-manager";
import { AppConfig } from "../app.config";

const colors = [
    "Red", "Orange", "Yellowish", "Greenish", "Bluish", "Purplish", "Pinkish", "Brownish", "Blackish", "Whitish",
    "Grayish", "Teal", "Turquoise", "Magenta", "Lavender", "Coral", "Golden", "Silvery", "Beige", "Ivory", "Indigo",
    "Violet", "Minty", "Crimson", "Olive", "Maroon", "Navy", "Amber", "Cyan", "Azure", "Lime", "Cobalt", "Copper"
];

const adjectives: string[] = [
    "Bubbly", "Jazzy", "Snazzy", "Zesty", "Wobbly", "Dandy", "Doodle", "Loopy", "Perky",
    "Wiggly", "Sassy", "Peppy", "Swirly", "Fizzy", "Chipper", "Zippy", "Poppy", "Plucky",
    "Sprightly", "Mellow", "Jumpy", "Giddy", "Cheeky", "Spiffy", "Frothy", "Breezy", "Nifty",
    "Brave", "Clever", "Witty", "Kind", "Fierce", "Happy", "Jolly", "Sneaky", "Bouncy", "Dizzy",
    "Goofy", "Lucky", "Fluffy", "Cheerful", "Grumpy", "Wacky", "Puzzled", "Eccentric", "Spunky",
    "Quirky", "Funky", "Chirpy", "Snappy", "Whizzy", "Zany"
];

const animals = [
    "Lion", "Tiger", "Bear", "Wolf", "Eagle", "Shark", "Panda", "Giraffe", "Koala", "Penguin",
    "Sloth", "Otter", "Kangaroo", "Raccoon", "Squirrel", "Turtle", "Llama", "Monkey", "Hippo", "Elephant",
    "Rabbit", "Hedgehog", "Parrot", "Owl", "Moose", "Duck", "Goose", "Ferret", "Octopus", "Platypus"
];
const userRepository: Repository<User> = MetricsDB.getRepository(User);
const usersCache = createCache();

export class UserFactory {
    public static async preloadCacheByTeam(teamName: string): Promise<void> {
        const users = await userRepository.find({ where: { teamName: teamName } });
        for (const user of users) {
            const cacheKey = `${teamName}-${user.login}`;
            await usersCache.set(cacheKey, user);
        }
    }

    public static async fetch({ teamName, login, isBotUser, isFormerEmployee }: {
        teamName: string,
        login: string,
        isBotUser: boolean,
        isFormerEmployee: boolean
    }): Promise<User> {
        const cacheKey = `${teamName}-${login}`;
        login = AppConfig.userNameNormalizerFn(login);

        return await usersCache.wrap(cacheKey, async () => {
            let user = await userRepository.findOne({ where: { teamName, login } });

            if (user) {
                return user;
            }

            const nickname = await UserFactory.generateUniqueNickname(teamName);
            user = userRepository.create({
                teamName,
                login,
                isBotUser,
                isFormerEmployee,
                nickname
            });

            await userRepository.save(user);
            return user;
        });
    }

    private static async generateUniqueNickname(teamName: string): Promise<string> {
        let nickname: string;
        let isUnique = false;

        do {
            nickname = UserFactory.generateNickname();
            const existingUser = await userRepository.findOne({ where: { teamName, nickname } });
            if (!existingUser) {
                isUnique = true;
            } else {
                console.log(`👻 Nickname "${nickname}" is already taken. Checking for another one...`);
            }
        } while (!isUnique);

        return nickname;
    }

    private static generateNickname(): string {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const adjective = adjectives[Math.floor(Math.random() * colors.length)];
        const animal = animals[Math.floor(Math.random() * animals.length)];
        return `${color} ${adjective} ${animal}`;
    }

}