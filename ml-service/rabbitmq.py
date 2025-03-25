import pika
import json

class RabbitMQConnection:
    """Handles RabbitMQ connection and message publishing."""

    def __init__(self, host, port, username, password):
        """Initializes the RabbitMQ connection parameters."""
        self.host = host
        self.port = self.port
        self.username = username
        self.password = password
        self.connection = None
        self.channel = None

    def connect(self):
        """Establishes a connection to RabbitMQ and declares a queue."""
        self.connection = pika.BlockingConnection(
            pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=pika.PlainCredentials(
                    username=self.username,
                    password=self.password
                )
            )
        )
        self.channel = self.connection.channel()
        self.channel.queue_declare(queue="match-queue", durable=True)  # Ensures the queue is durable.

    def send_match(self, user_id, match):
        """Sends match data to RabbitMQ."""
        if not self.channel:
            raise RuntimeError("RabbitMQ channel is not initialized. Call connect() first.")

        # Prepare the message body as JSON.
        body = json.dumps({
            **{"user_id": user_id, "match": match},
            "username": match.get("username"),
            "match_username": match.get("match_username")
        })

        # Publish the message to the RabbitMQ exchange.
        self.channel.basic_publish(
            exchange="proj2",
            routing_key="match-routing",
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2  # Makes the message persistent.
            )
        )
        print(f"📤 Sent match {user_id} -> {match} to RabbitMQ", flush=True)

    def close_connection(self):
        """Closes the RabbitMQ connection."""
        if self.connection:
            self.connection.close()
            print("🔌 RabbitMQ connection closed.", flush=True)