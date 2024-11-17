import { Actor } from "./entities/Actor";
import { MetricsDB } from "./MetricsDB";
import { Repository } from "typeorm";
import { createCache } from "cache-manager";

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
const actorsRepository: Repository<Actor> = MetricsDB.getRepository(Actor);
const actorsCache: ReturnType<typeof createCache> = createCache();

export class ActorFactory {
    public static async preloadCacheByTeam(teamName: string): Promise<void> {
        const users = await actorsRepository.find({ where: { teamName: teamName } });
        for (const user of users) {
            const cacheKey = `${teamName}-${user.login}`;
            await actorsCache.set(cacheKey, user);
        }
    }

    public static async fetch({ teamName, login, isBotUser }: {
        teamName: string,
        login: string,
        isBotUser: boolean
    }): Promise<Actor> {
        const cacheKey = `${teamName}-${login}`;

        return await actorsCache.wrap(cacheKey, async () => {
            let user = await actorsRepository.findOne({ where: { teamName, login } });

            if (user) {
                return user;
            }

            const nickname = await ActorFactory.generateUniqueNickname(teamName);
            user = actorsRepository.create({
                teamName,
                login,
                isBotUser,
                isFormerParticipant: false,
                nickname
            });

            await actorsRepository.save(user);
            return user;
        });
    }

    private static async generateUniqueNickname(teamName: string): Promise<string> {
        let nickname: string;
        let isUnique = false;

        do {
            nickname = ActorFactory.generateNickname();
            const existingUser = await actorsRepository.findOne({ where: { teamName, nickname } });
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