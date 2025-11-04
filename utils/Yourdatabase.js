import knex from "knex";

export default knex({
  client: "pg",
  connection: {
    host: "your-database-host",
    port: "your-database-port",
    user: "your-database-username",
    password: "your-database-password",
    database: "postgres",
  },
  pool: { min: 0, max: 10 },
});