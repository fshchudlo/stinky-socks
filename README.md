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

> 💡 People use tools in diverse ways, and the importer logic may not always account for every scenario. Time zones, Git
> history rewrites, and occasional quirks in Bitbucket and GitHub APIs (like missing commit data for pull requests, as
> in
> [this example](https://github.com/grafana/grafana/pull/637)) can all impact data consistency.
>
> To manage this, the [PullRequest.ts](src/MetricsDB/entities/PullRequest.ts) class includes a `validateDataIntegrity` method.
> Validation errors are logged during
> import, and while invalid pull requests are stored in the database, they’re excluded from Grafana panels.
>
> I recommend carefully reviewing this data to spot any irregularities.
>
> This feature is also could helpful if you’re building your own importer for the SCM system of your need (and we’d love your
> contributions!).
~~~~
### Running unit tests

- Easy as ```npm run test```.
- Since I'm a lazy guy, tests use snapshots. You can update them by running ```npm run test:update-snapshots```

### Managing database structure

- This project uses [TypeORM](https://typeorm.io/migrations) for database migrations. After modifying the schema, you
  can apply migrations using
  ```npm run migration:generate ./src/MetricsDB/migrations/<MIGRATION NAME>```
- Migrations are automatically applied when the app starts, so no manual intervention is typically needed.
- You can manage migrations process on your own with `npm run migration:run` and `npm run migration:revert` commands.