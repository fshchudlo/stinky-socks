# stinky-socks

### App to import DevEx metrics of different kind.

### Configuring dev environment
- Install [Node.js and npm](https://nodejs.org) on your machine
- Run `npm i` from the repo root directory
- Run Postgres and Grafana by using `docker-compose -f assets/docker-compose.yml up -d` file
- Create the copy of `.env.example` file, name it `.env` and provide relevant config values.
- Fill `./src/app.importCconfig.ts` with values relevant to you.
  - 💡 You can use `git update-index --assume-unchanged ./src/app.importCconfig.ts` to prevent occasional commits of your config
- Run ```npm run start```

### Running unit tests
- Easy as ```npm run test```.
- Since I'm a lazy guy, tests use snapshots. You can update them by running ```npm run test:update-snapshots```

### Running the service
- You can use provided `Dockerfile` to build an image and run it with ENV variables identical to variables
  specified in `.env.example` described above
```bash
docker build -t stinky-socks:latest .
```