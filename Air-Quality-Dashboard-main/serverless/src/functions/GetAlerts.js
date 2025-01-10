const { app } = require("@azure/functions");
const CosmosClient = require("@azure/cosmos").CosmosClient;

app.http("GetAlerts", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "alerts/{username}",
  handler: async (request, context) => {
    try {
      const options = {
        endpoint: process.env["COSMOS_ENDPOINT"],
        key: process.env["COSMOS_KEY"],
      };

      const client = new CosmosClient(options);
      const database_id = process.env["COSMOS_DATABASE_ID"];
      const container_id = process.env['COSMOS_ALERTS_CONTAINER_ID'];
      const username = request.params.username

      const query = {
        query: `
          SELECT *
          FROM c
          WHERE c.username = @username`,
        parameters: [
          { name: '@username', value: username },
        ]
      }

      const items = await client
        .database(database_id)
        .container(container_id)
        .items.query(query)
        .fetchAll();
      return {
        body: JSON.stringify(items)
      }
    } catch (err) {
      context.log(err);
      throw err;
    }
  },
});
