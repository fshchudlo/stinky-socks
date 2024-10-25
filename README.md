# stinky-socks

### App to import DevEx metrics of different kind.

### Configuring dev environment

- Install [Node.js and npm](https://nodejs.org) on your machine
- Run `npm i` from the repo root directory
- Run Postgres and Grafana by using `docker-compose -f assets/docker-compose.yml up -d` file
- Create the copy of `.env.example` file, name it `.env` and provide relevant config values.
- Fill [app.importConfig.ts](src/app.importConfig.ts) with values relevant to you.
  > 💡 You can use `git update-index --assume-unchanged ./src/app.importCconfig.ts` to prevent occasional commits of
  > your config
- Run ```npm run start``` to initiate the import of the data

### Running the import

- The import process is configured in [app.importConfig.ts](src/app.importConfig.ts). You can specify SCM system (
  currently Bitbucket DC
  and GitHub are supported), the repositories you want to import, and so on.
- Run `docker-compose -f assets/docker-compose.yml up -d` to start Postgres and Grafana. It also configures Grafana
  datasource and dashboard and Postgres database.
- Run `npm run start` to start the import process.
- Alternatively, you can run the following command to build the importer, start it in docker-compose too, and listen
  for its logs:
  ```docker-compose -f assets/docker-compose.yml -f assets/docker-compose.dev.yml up -d --build && docker logs stinky-socks-importer --follow```

> 💡 There may be irregularities in the data. For instance, both the GitHub and Bitbucket APIs sometimes return no data
> about commits (see [this as example](https://github.com/grafana/grafana/pull/637)).
>
> I recommend thoroughly filtering such data using the `pullRequestsFilterFn` function
> in [app.importConfig.ts](src/app.importConfig.ts) to prevent noising of the dataset.

### Running unit tests

- Easy as ```npm run test```.
- Since I'm a lazy guy, tests use snapshots. You can update them by running ```npm run test:update-snapshots```

### Managing database structure

- This project uses [TypeORM](https://typeorm.io/migrations) for database migrations. After modifying the schema, you
  can apply migrations using
  ```npm run migration:generate ./src/MetricsDB/migrations/<MIGRATION NAME>```
- Migrations are automatically applied when the app starts, so no manual intervention is typically needed.
- You can manage migrations process on your own with `npm run migration:run` and `npm run migration:revert` commands.