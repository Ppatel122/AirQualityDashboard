const { app } = require("@azure/functions");
const CosmosClient = require("@azure/cosmos").CosmosClient;

app.http("DeleteAlert", {
  methods: ["DELETE"],
  authLevel: "anonymous",
  route: "alerts/{id}",
  handler: async (request, context) => {
    try {
      const options = {
        endpoint: process.env["COSMOS_ENDPOINT"],
        key: process.env["COSMOS_KEY"],
      };
      const client = new CosmosClient(options);
      const database_id = process.env["COSMOS_DATABASE_ID"];
      const container_id = process.env['COSMOS_ALERTS_CONTAINER_ID'];

      return client
        .database(database_id)
        .container(container_id)
        .item(request.params.id)
        .delete();
    } catch (err) {
      context.log(err);
      throw err;
    }
  },
});
