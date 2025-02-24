import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
    schema: "./src/db/schema",
    dialect: "turso",
    out: "./src/db/migrations",
    dbCredentials: {
        url: TURSO_CONNECTION_URL, // change this
        authToken: TURSO_AUTH_TOKEN, // change this
    },

});

