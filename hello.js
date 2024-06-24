import sqlite3
import json
import os

# Locate the pgadmin4.db file
db_path = os.path.expanduser('~/.pgadmin/pgadmin4.db')  # Update this path based on your OS

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch server configurations
cursor.execute("SELECT * FROM server")
servers = cursor.fetchall()

# Define column names for the server table
columns = [desc[0] for desc in cursor.description]

# Convert the server configurations to a list of dictionaries
servers_dict = []
for server in servers:
    server_dict = dict(zip(columns, server))
    for key, value in server_dict.items():
        if isinstance(value, bytes):
            server_dict[key] = value.decode('utf-8')  # Convert bytes to string
        elif value is None:
            server_dict[key] = None
    servers_dict.append(server_dict)

# Write the server configurations to a JSON file
with open('pgadmin_servers.json', 'w') as f:
    json.dump(servers_dict, f, indent=4)

# Close the database connection
conn.close()