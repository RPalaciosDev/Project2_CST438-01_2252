import pika
import json
import threading
import time
from datetime import datetime

class RabbitMQConnection:
    def __init__(self, host, port, username, password):
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.connection = None
        self.channel = None
        self.is_connected = False
        self.heartbeat_thread = None
        self.stop_heartbeat = False
        self.connection_lock = threading.Lock()
        
    def connect(self):
        """Establish connection to RabbitMQ"""
        try:
            print(f"🔌 Connecting to RabbitMQ at {self.host}:{self.port} as user '{self.username}'", flush=True)
            
            # Set up connection parameters with more robust settings
            connection_params = pika.ConnectionParameters(
                host=self.host,
                port=self.port,
                credentials=pika.PlainCredentials(
                    username=self.username,
                    password=self.password
                ),
                heartbeat=30,  # Set RabbitMQ heartbeat to 30 seconds
                blocked_connection_timeout=60,  # Timeout after 60 seconds
                connection_attempts=3,  # Try to connect up to 3 times
                retry_delay=5  # Wait 5 seconds between connection attempts
            )
            
            self.connection = pika.BlockingConnection(connection_params)
            self.channel = self.connection.channel()
            
            # Declare exchanges and queues with proper settings
            print("📝 Setting up RabbitMQ channel and queues", flush=True)
            
            # First check if queues already exist by using passive=True
            try:
                # This will raise an exception if the queue doesn't exist
                self.channel.queue_declare(queue="match", passive=True)
                print("✅ Queue 'match' already exists, using existing queue", flush=True)
            except Exception as e:
                print(f"🆕 Queue 'match' doesn't exist, creating new queue: {e}", flush=True)
                # Queue doesn't exist, create it with our desired parameters
                self.channel.queue_declare(
                    queue="match", 
                    durable=True  # Queue survives broker restart
                )
            
            # Try to create dead letter queue as a best effort
            try:
                self.channel.queue_declare(
                    queue="match_dlq",
                    durable=True
                )
                print("✅ Dead letter queue created/verified", flush=True)
            except Exception as e:
                print(f"⚠️ Could not setup dead letter queue: {e}", flush=True)
                # Continue anyway
            
            # Set prefetch count to limit how many messages are processed at once
            try:
                self.channel.basic_qos(prefetch_count=10)
            except Exception as e:
                print(f"⚠️ Could not set prefetch count: {e}", flush=True)
                # Continue anyway
            
            self.is_connected = True
            print(f"✅ RabbitMQ connection established at {datetime.now()}", flush=True)
            
            # Start heartbeat thread if not already running
            if not self.heartbeat_thread or not self.heartbeat_thread.is_alive():
                self.start_heartbeat()
                
            return True
        except Exception as e:
            self.is_connected = False
            print(f"❌ RabbitMQ connection failed: {e}", flush=True)
            return False
    
    def ensure_connection(self):
        """Ensure connection is active before proceeding"""
        with self.connection_lock:
            if not self.is_connected or not self.connection or self.connection.is_closed:
                print("🔄 RabbitMQ connection lost, attempting to reconnect...", flush=True)
                return self.connect()
            return True
            
    def send_match(self, user_id, match):
        """Send match data to RabbitMQ with connection verification"""
        # First ensure we have a connection
        if not self.ensure_connection():
            print(f"⚠️ Failed to send match {user_id} -> {match}: No connection", flush=True)
            return False
            
        try:
            # Create a simple but effective message structure
            message = {
                "user_id": user_id,
                "match": match,
                "timestamp": datetime.now().isoformat(),
                "source": "ml-service"
            }
            
            body = json.dumps(message)
            print(f"📦 Message payload: {body[:100]}{'...' if len(body) > 100 else ''}", flush=True)
            
            with self.connection_lock:
                self.channel.basic_publish(
                    exchange="",
                    routing_key="match",
                    body=body,
                    properties=pika.BasicProperties(
                        delivery_mode=2  # Makes message persistent
                    )
                )
            print(f"📤 Sent match {user_id} -> {match} to RabbitMQ", flush=True)
            return True
        except Exception as e:
            print(f"❌ Failed to send match: {e}", flush=True)
            self.is_connected = False  # Mark as disconnected
            return False
    
    def start_heartbeat(self):
        """Start the heartbeat thread"""
        self.stop_heartbeat = False
        self.heartbeat_thread = threading.Thread(target=self._heartbeat_thread_func)
        self.heartbeat_thread.daemon = True  # Allow the thread to exit when main program exits
        self.heartbeat_thread.start()
        print("💓 RabbitMQ heartbeat thread started", flush=True)
    
    def _heartbeat_thread_func(self):
        """Thread function to periodically check and maintain RabbitMQ connection"""
        heartbeat_count = 0
        
        while not self.stop_heartbeat:
            try:
                # Check connection every 15 seconds
                time.sleep(15)
                
                # Skip heartbeat if we're shutting down
                if self.stop_heartbeat:
                    break
                    
                # Check if connection is alive
                heartbeat_count += 1
                
                if not self.ensure_connection():
                    print("💓 Heartbeat detected connection failure, reconnected", flush=True)
                else:
                    # Send a heartbeat message to maintain the connection
                    with self.connection_lock:
                        if self.connection and not self.connection.is_closed:
                            self.connection.process_data_events()  # Process any pending events
                            # Only log every 20 heartbeats (5 minutes) to reduce noise
                            if heartbeat_count % 20 == 0:
                                print(f"💓 Heartbeat successful (#{heartbeat_count})", flush=True)
                            
            except Exception as e:
                print(f"❌ Heartbeat error: {e}", flush=True)
                self.is_connected = False
                
                # Try to reconnect immediately after a heartbeat failure
                self.ensure_connection()
    
    def close_connection(self):
        """Close RabbitMQ connection and stop heartbeat"""
        self.stop_heartbeat = True
        
        # Wait for heartbeat thread to terminate
        if self.heartbeat_thread and self.heartbeat_thread.is_alive():
            self.heartbeat_thread.join(timeout=2.0)
            
        with self.connection_lock:
            if self.connection and not self.connection.is_closed:
                try:
                    self.connection.close()
                    print("🔌 RabbitMQ connection closed gracefully", flush=True)
                except Exception as e:
                    print(f"⚠️ Error closing RabbitMQ connection: {e}", flush=True)
            
        self.is_connected = False
        self.connection = None
        self.channel = None
    
    def get_queue_info(self):
        """Get information about the queues we're using"""
        if not self.ensure_connection():
            return {"error": "Not connected to RabbitMQ"}
            
        queue_info = {
            "connection_status": "active" if self.is_connected else "inactive",
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            with self.connection_lock:
                # Get queue info for main queue
                try:
                    match_queue = self.channel.queue_declare(queue="match", passive=True)
                    queue_info["match_queue"] = {
                        "message_count": match_queue.method.message_count,
                        "consumer_count": match_queue.method.consumer_count,
                        "status": "exists"
                    }
                    print(f"📊 Match queue stats: {match_queue.method.message_count} msgs", flush=True)
                except Exception as e:
                    queue_info["match_queue"] = {
                        "status": "error",
                        "error": str(e)
                    }
                    print(f"⚠️ Could not get match queue info: {e}", flush=True)
                
                # Get queue info for DLQ
                try:
                    dlq_queue = self.channel.queue_declare(queue="match_dlq", passive=True)
                    queue_info["dead_letter_queue"] = {
                        "message_count": dlq_queue.method.message_count,
                        "consumer_count": dlq_queue.method.consumer_count,
                        "status": "exists"
                    }
                    print(f"📊 DLQ stats: {dlq_queue.method.message_count} msgs", flush=True)
                except Exception as e:
                    queue_info["dead_letter_queue"] = {
                        "status": "error",
                        "error": str(e)
                    }
                    print(f"⚠️ Could not get DLQ info: {e}", flush=True)
                
                return queue_info
        except Exception as e:
            print(f"❌ Error getting queue info: {e}", flush=True)
            return {"error": str(e), "connection_status": "error"}
    
    def purge_queues(self):
        """Purge all messages from the queues (for testing/reset)"""
        if not self.ensure_connection():
            return {"error": "Not connected to RabbitMQ"}
            
        results = {
            "status": "success",
            "timestamp": datetime.now().isoformat(),
            "details": {}
        }
        
        try:
            with self.connection_lock:
                # Purge main queue
                try:
                    # First check if the queue exists
                    self.channel.queue_declare(queue="match", passive=True)
                    # Then purge it
                    self.channel.queue_purge(queue="match")
                    results["details"]["match_queue"] = "purged"
                    print(f"🧹 Purged messages from match queue", flush=True)
                except Exception as e:
                    results["details"]["match_queue"] = f"error: {str(e)}"
                    print(f"⚠️ Could not purge match queue: {e}", flush=True)
                
                # Purge DLQ
                try:
                    # First check if the queue exists
                    self.channel.queue_declare(queue="match_dlq", passive=True)
                    # Then purge it
                    self.channel.queue_purge(queue="match_dlq")
                    results["details"]["match_dlq"] = "purged"
                    print(f"🧹 Purged messages from dead letter queue", flush=True)
                except Exception as e:
                    results["details"]["match_dlq"] = f"error: {str(e)}"
                    print(f"⚠️ Could not purge dead letter queue: {e}", flush=True)
                
                return results
        except Exception as e:
            print(f"❌ Error purging queues: {e}", flush=True)
            return {"error": str(e), "status": "failed"}