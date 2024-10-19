# stinky-socks

### App to import DevEx metrics of different kind.

### Configuring dev environment

- Install [Node.js and npm](https://nodejs.org) on your machine
- Run `npm i` from the repo root directory
- Run Postgres and Grafana by using `docker-compose -f assets/docker-compose.yml up -d` file
- Create the copy of `.env.example` file, name it `.env` and provide relevant config values.
- Fill `./src/app.importConfig.ts` with values relevant to you.
    - 💡 You can use `git update-index --assume-unchanged ./src/app.importCconfig.ts` to prevent occasional commits of
      your config
- Run ```npm run start``` to initiate the import of the data

### Recommendations regarding import

- Occasionally, there may be irregularities in the data. For instance, both the GitHub and Bitbucket APIs sometimes fail
  to return data about commits (see [this as example](https://github.com/grafana/grafana/pull/637)). I recommend thoroughly filtering such data using the
  pullRequestsFilterFn function in ./src/app.importConfig.ts to prevent these cases from introducing noise into the
  dataset.

### Running unit tests

- Easy as ```npm run test```.
- Since I'm a lazy guy, tests use snapshots. You can update them by running ```npm run test:update-snapshots```

### Managing database structure

- This project uses [TypeORM](https://typeorm.io/migrations) for database migrations. After modifying the schema, you
  can apply migrations using
  ```npm run migration:generate ./src/MetricsDB/migrations/<MIGRATION NAME>```
- Migrations are automatically applied when the app starts, so no manual intervention is typically needed.
- For more granular control, you can manage migrations using the `npm run migration:run` and `npm run migration:revert`
  commands.

### Building docker image

- You can use provided `Dockerfile` to build an image and run it with ENV variables identical to variables
  specified in `.env.example` described above

```bash
docker build -t stinky-socks:latest .
```
