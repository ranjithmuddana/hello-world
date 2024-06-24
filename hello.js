import sqlite3
import json
import os

# Locate the pgadmin4.db file
db_path = os.path.expanduser('~/.pgadmin/pgadmin4.db')  # Update this path based on your OS

# Connect to the SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch server configurations
cursor.execute("SELECT * FROM servers")
servers = cursor.fetchall()

# Define column names for the servers table
columns = [desc[0] for desc in cursor.description]

# Convert the server configurations to a list of dictionaries
servers_dict = [dict(zip(columns, server)) for server in servers]

# Write the server configurations to a JSON file
with open('pgadmin_servers.json', 'w') as f:
    json.dump(servers_dict, f, indent=4)

# Close the database connection
conn.close()