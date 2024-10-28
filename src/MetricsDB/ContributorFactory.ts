import { Contributor } from "./entities/Contributor";
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
const contributorRepo: Repository<Contributor> = MetricsDB.getRepository(Contributor);
const contributorsCache = createCache();

export class ContributorFactory {
    public static async preloadCacheByTeam(teamName: string): Promise<void> {
        const contributors = await contributorRepo.find({ where: { teamName: teamName } });
        for (const contributor of contributors) {
            const cacheKey = `${teamName}-${contributor.login}`;
            await contributorsCache.set(cacheKey, contributor);
        }
    }

    public static async fetchContributor({ teamName, login, isBotUser, isFormerEmployee }: {
        teamName: string,
        login: string,
        isBotUser: boolean,
        isFormerEmployee: boolean
    }): Promise<Contributor> {
        const cacheKey = `${teamName}-${login}`;
        login = AppConfig.userNameNormalizerFn(login);

        return await contributorsCache.wrap(cacheKey, async () => {
            let contributor = await contributorRepo.findOne({ where: { teamName, login } });

            if (contributor) {
                return contributor;
            }

            const nickname = await ContributorFactory.generateUniqueNickname(teamName);
            contributor = contributorRepo.create({
                teamName,
                login,
                isBotUser,
                isFormerEmployee,
                nickname
            });

            await contributorRepo.save(contributor);
            return contributor;
        });
    }

    private static async generateUniqueNickname(teamName: string): Promise<string> {
        let nickname: string;
        let isUnique = false;

        do {
            nickname = ContributorFactory.generateNickname();
            const existingContributor = await contributorRepo.findOne({ where: { teamName, nickname } });
            if (!existingContributor) {
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