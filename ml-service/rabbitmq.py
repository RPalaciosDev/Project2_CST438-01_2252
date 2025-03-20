import pika
import json

class RabbitMQConnection:
    def __init__(self, host, port, username, password):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.connection = None
        self.channel = None

    def connect(self):
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
        self.channel.queue_declare(queue="match", durable=True)  

    def send_match(self, user_id, match):
        """Send match data to RabbitMQ"""
        if not self.channel:
            raise RuntimeError("RabbitMQ channel is not initialized. Call connect() first.")

        body = json.dumps({"user_id": user_id, "match": match})  # Fix: Use json.dumps instead of pika.SimpleQueue
        self.channel.basic_publish(
            exchange="",
            routing_key="match",
            body=body,
            properties=pika.BasicProperties(
                delivery_mode=2  # Makes message persistent
            )
        )
        print(f"📤 Sent match {user_id} -> {match} to RabbitMQ", flush=True)

    def close_connection(self):
        if self.connection:
            self.connection.close()
            print("🔌 RabbitMQ connection closed.", flush=True)