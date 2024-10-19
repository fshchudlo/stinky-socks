import { Contributor } from "./Contributor";
import { MetricsDB } from "./MetricsDB";
import { Repository } from "typeorm";
import { createCache } from "cache-manager";

// Функция для генерации случайного никнейма
const adjectives = [
    'Brave', 'Clever', 'Witty', 'Kind', 'Fierce', 'Happy', 'Jolly', 'Sneaky', 'Bouncy', 'Dizzy',
    'Goofy', 'Zippy', 'Lucky', 'Fluffy', 'Cheerful', 'Grumpy', 'Wacky', 'Silly', 'Sunny', 'Spunky',
    'Quirky', 'Funky', 'Chirpy', 'Nifty', 'Snappy', 'Peppy', 'Perky', 'Whizzy', 'Zany', 'Breezy'
];

const animals = [
    'Lion', 'Tiger', 'Bear', 'Wolf', 'Eagle', 'Shark', 'Panda', 'Giraffe', 'Koala', 'Penguin',
    'Sloth', 'Otter', 'Kangaroo', 'Raccoon', 'Squirrel', 'Turtle', 'Llama', 'Monkey', 'Hippo', 'Elephant',
    'Rabbit', 'Hedgehog', 'Parrot', 'Owl', 'Moose', 'Duck', 'Goose', 'Ferret', 'Octopus', 'Platypus'
];

function generateNickname(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    return `${adjective}${animal}`;
}

export class ContributorFactory {
    private contributorRepo: Repository<Contributor> = MetricsDB.getRepository(Contributor);
    private cache = createCache();

    public async preloadCacheByTeam(teamName: string): Promise<void> {
        const contributors = await this.contributorRepo.find({ where: { teamName: teamName } });
        for (const contributor of contributors) {
            const cacheKey = `${teamName}-${contributor.login}`;
            await this.cache.set(cacheKey, contributor);
        }
    }

    public async fetchContributor(teamName: string, login: string, isBotUser: boolean, isFormerEmployee: boolean): Promise<Contributor> {
        const cacheKey = `${teamName}-${login}`;

        return await this.cache.wrap(cacheKey, async () => {
            let contributor = await this.contributorRepo.findOne({ where: { teamName: teamName, login } });

            if (contributor) {
                return contributor;
            }

            const nickname = await this.generateUniqueNickname(teamName);
            contributor = this.contributorRepo.create({
                teamName,
                login,
                isBotUser,
                isFormerEmployee,
                nickname
            });

            await this.contributorRepo.save(contributor);
            return contributor;
        });
    }

    private async generateUniqueNickname(team: string): Promise<string> {
        let nickname: string;
        let isUnique = false;

        do {
            nickname = generateNickname();
            const existingContributor = await this.contributorRepo.findOne({ where: { teamName: team, nickname } });
            if (!existingContributor) {
                isUnique = true;
            }
        } while (!isUnique);

        return nickname;
    }
}