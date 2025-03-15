import pika

class RabbitMQConnection:
    def __init__(self, host, port, username
                 , password):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.connection = None
        
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
        
    def send_match(self, user_id, match):
        channel = self.connection.channel()
        body = {'user_id': user_id, 'match': match}
        channel.basic_publish(
            exchange="proj2",
            routing_key="match",
            body=pika.SimpleQueue.dumps(body)
        )
        
    def close_connection(self):
        if self.connection:
            self.connection.close()