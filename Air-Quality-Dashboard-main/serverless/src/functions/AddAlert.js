const { app } = require("@azure/functions");
const CosmosClient = require("@azure/cosmos").CosmosClient;

app.http("AddAlert", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "alerts",
  handler: async (request, context) => {
    try {
      const options = {
        endpoint: process.env["COSMOS_ENDPOINT"],
        key: process.env["COSMOS_KEY"],
      };

      const client = new CosmosClient(options);
      const database_id = process.env["COSMOS_DATABASE_ID"];
      const container_id = process.env["COSMOS_ALERTS_CONTAINER_ID"];
      const body = await request.json();
      const res = await client
        .database(database_id)
        .container(container_id)
        .items.create(body);
      return {
        body: res.item.id,
        status: 201,
      };
    } catch (err) {
      context.log(err);
      throw err;
    }
  },
});
