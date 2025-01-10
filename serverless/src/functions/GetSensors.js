const { app } = require('@azure/functions');
const CosmosClient = require("@azure/cosmos").CosmosClient

async function query_sensors(client, container_id) {

    const database_id = process.env['COSMOS_DATABASE_ID'];
    // const container_id = process.env['COSMOS_CONTAINER_ID'];
  
    current_timestamp = Math.floor(Date.now() / 1000);
    one_hour_ago_timestamp = current_timestamp - 3600;
    
    const query = {
      query: `
        SELECT *
        FROM c
        WHERE c._ts >= @startTime AND c._ts <= @endTime`,
      parameters: [
        { name: '@startTime', value: one_hour_ago_timestamp },
        { name: '@endTime', value: current_timestamp }
      ]
    }
  
    const { resources: results } = await client
      .database(database_id)
      .container(container_id)
      .items.query(query)
      .fetchAll()
    
    return results;
  }

app.http('GetSensors', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const options = {
              endpoint: process.env['COSMOS_ENDPOINT'],
              key: process.env['COSMOS_KEY'],
            };

            const client = new CosmosClient(options);
            purpleair_result = await query_sensors(client, process.env['COSMOS_PURPLEAIR_CONTAINER_ID'])
            station_result = await query_sensors(client, process.env['COSMOS_STATION_CONTAINER_ID'])

            return { body: JSON.stringify({purpleair: purpleair_result, station: station_result })};

        } catch (err) {
            context.log(err);
            throw err;
        }
    }
});