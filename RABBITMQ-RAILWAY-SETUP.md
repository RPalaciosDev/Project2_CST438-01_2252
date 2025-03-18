# RabbitMQ Setup Guide for Railway

This guide explains how to set up RabbitMQ on Railway and configure it with your services.

## Setting up RabbitMQ on Railway

1. **Create a RabbitMQ Service**
   - Log in to your [Railway Dashboard](https://railway.app/dashboard)
   - Click "New Project" or select an existing project
   - Click "New Service" → "Database" → "RabbitMQ"
   - Wait for the service to be provisioned

2. **Get RabbitMQ Connection Details**
   - Click on your new RabbitMQ service
   - Go to the "Variables" tab
   - You should see a variable called `RABBITMQ_URL` with a value like:
     ```
     amqp://SUbJk8v5oJraoWN9:TcDgsJM6e3fVcLn.Sl6QS6_2TN4d-5mj@rabbitmq.railway.internal:5672
     ```
   - This is your RabbitMQ connection URL

## Connecting Services to RabbitMQ

For each service that needs to connect to RabbitMQ (auth-user-api and tier-list-service):

1. **Add RabbitMQ URL to Service Variables**
   - Go to your service (auth-user-api or tier-list-service)
   - Click the "Variables" tab
   - Add these variables:
   
   ```
   RABBITMQ_URL=amqp://SUbJk8v5oJraoWN9:TcDgsJM6e3fVcLn.Sl6QS6_2TN4d-5mj@rabbitmq.railway.internal:5672
   ```
   
   For auth-user-api, also add:
   ```
   RABBITMQ_EXCHANGE=auth_exchange
   RABBITMQ_ROUTING_KEY=auth.key
   ```
   
   For tier-list-service, also add:
   ```
   RABBITMQ_EXCHANGE=tierlist_exchange
   RABBITMQ_ROUTING_KEY=tierlist.key
   ```

2. **Redeploy Services**
   - After adding the variables, click the "Deploy" button for each service
   - Wait for the deployment to complete

## Testing the RabbitMQ Connection

To verify that your services are properly connected to RabbitMQ:

1. **Test the API Endpoint**
   - Open your browser or use a tool like Postman
   - Access the test endpoint in auth-user-api:
     ```
     GET https://your-auth-service-url.railway.app/api/test/rabbitmq?message=TestMessage
     ```
   - If successful, you should get a response with status 200 OK

2. **Check Service Logs**
   - Go to your services in Railway
   - Click the "Logs" tab for both services
   - In auth-user-api logs, look for:
     ```
     Test message sent successfully
     ```
   - In tier-list-service logs, look for:
     ```
     Received message from RabbitMQ: TestMessage
     ```

## Troubleshooting

If you encounter issues:

1. **Connection Problems**
   - Make sure the RABBITMQ_URL is correctly copied from the RabbitMQ service variables
   - Check that both services are in the same Railway project to use internal networking
   - Verify the `rabbitmq.railway.internal` hostname is accessible from your services

2. **Application Configuration Issues**
   - Ensure the environment variables match exactly what's expected in the application:
     - RABBITMQ_URL
     - RABBITMQ_EXCHANGE
     - RABBITMQ_ROUTING_KEY
   - Check logs for specific Spring AMQP errors

3. **Exchange/Queue Mismatches**
   - If messages aren't being delivered, make sure the exchange names and routing keys match between services
   - The queue names are hardcoded in the application as:
     - auth_queue for auth-user-api
     - tierlist_queue for tier-list-service

## Infrastructure Details

- The RabbitMQ connection uses Railway's internal network (`rabbitmq.railway.internal`)
- Queue creation is automatic when the applications start
- Exchanges and queues are configured as durable to survive broker restarts
- Retry logic is enabled with exponential backoff for resilience 