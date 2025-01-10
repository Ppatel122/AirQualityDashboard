import { CosmosClient } from "@azure/cosmos";
import { getAlerts, createAlert, deleteAlert, Alert } from "../app/alerts.service";
import { log } from "console"
import { cli } from "@remix-run/dev";
require('dotenv').config()

describe('FR23 - Alert.Subscription & FR24 - Alert.Unsubscription & FR26 - Alert.Customization', () => {

  const options = {
    endpoint: process.env['COSMOS_ENDPOINT'],
    key: process.env['COSMOS_KEY'],
  };

  const client = new CosmosClient(options as any)
  // retrive created alert from db
  const database_id = process.env.COSMOS_DATABASE_ID as string;
  const container_id = process.env.COSMOS_ALERTS_CONTAINER_ID as string;

  const name = "test-alert";
  const username = "test@email.com";
  const longitude = 0;
  const latitude = 1;
  const threshold = 3;
  const isabove = false;

  test('FR23 & FR 24 & FR 26 - create alert', async () => {

    const id = await createAlert({
      latitude,
      longitude,
      name,
      username,
      threshold,
      isabove
    }) || "";

    const query = {
      query: `
        SELECT *
        FROM c
        WHERE c.id = @id`,
      parameters: [
        { name: '@id', value: id },
      ]
    };

    const items = await client
      .database(database_id)
      .container(container_id)
      .items.query(query)
      .fetchAll();

    // expect to have all the correct fields
    const db_alert = items.resources[0];
    expect(db_alert.name).toBe(name)
    expect(db_alert.username).toBe(username)
    expect(db_alert.latitude).toBe(latitude)
    expect(db_alert.longitude).toBe(longitude)
    expect(db_alert.threshold).toBe(threshold)
    expect(db_alert.isabove).toBe(isabove)

    // delete test alert
    await client
      .database(database_id)
      .container(container_id)
      .item(id).delete()

  });

  test('FR23 & FR 24 & FR 26 - delete alert', async () => {

    // create alert
    const id = await createAlert({
      latitude,
      longitude,
      name,
      username,
      threshold,
      isabove
    }) || "";

    const query = {
      query: `
        SELECT *
        FROM c
        WHERE c.id = @id`,
      parameters: [
        { name: '@id', value: id },
      ]
    };

    let items = await client
      .database(database_id)
      .container(container_id)
      .items.query(query)
      .fetchAll();

    // expect the alert to exist in db
    expect(items.resources.length).toBe(1)

    // delete alert
    await deleteAlert(id)

    items = await client
    .database(database_id)
    .container(container_id)
    .items.query(query)
    .fetchAll();

    // expect the alert to not exist in db
    expect(items.resources.length).toBe(0)
  });

  test('FR23 & FR 24 & FR 26 - get alert', async () => {
        // create and get alert
        const id = await createAlert({
          latitude,
          longitude,
          name,
          username,
          threshold,
          isabove
        }) || "";
    
        const query = {
          query: `
            SELECT *
            FROM c
            WHERE c.id = @id`,
          parameters: [
            { name: '@id', value: id },
          ]
        };
    
        // retrive created alert from db using our function
        const alerts = await getAlerts("test@email.com") as Alert[]
        
        // retrive created alert using cosmos
        const items = await client
        .database(database_id)
        .container(container_id)
        .items.query(query)
        .fetchAll();
    
        // expect the alerts to be identical
        expect(alerts.length).toBe(items.resources.length)
        expect(alerts[0].id).toBe(items.resources[0].id)
        expect(alerts[0].name).toBe(items.resources[0].name)
        expect(alerts[0].username).toBe(items.resources[0].username)
        expect(alerts[0].threshold).toBe(items.resources[0].threshold)
        expect(alerts[0].isabove).toBe(items.resources[0].isabove)
        expect(alerts[0].latitude).toBe(items.resources[0].latitude)
        expect(alerts[0].longitude).toBe(items.resources[0].longitude)

      // delete test alert
      await client
        .database(database_id)
        .container(container_id)
        .item(id).delete()
  });
});