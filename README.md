import psycopg2
from psycopg2.extras import execute_values
from concurrent.futures import ThreadPoolExecutor
import time

# Database configuration
DB_CONFIG = {
    "dbname": "your_database",
    "user": "your_user",
    "password": "your_password",
    "host": "localhost",
    "port": 5432
}

# Function to call PostgreSQL function and record execution time
def call_function_and_measure_time():
    start_time = time.time()
    try:
        with psycopg2.connect(**DB_CONFIG) as conn:
            with conn.cursor() as cur:
                # Call the function
                cur.execute("SELECT sample_function();")
        end_time = time.time()
        elapsed_time = end_time - start_time
        return elapsed_time
    except Exception as e:
        return f"Error: {e}"

# Parallel execution using ThreadPoolExecutor
def execute_in_parallel(num_calls, num_threads):
    results = []
    with ThreadPoolExecutor(max_workers=num_threads) as executor:
        futures = [executor.submit(call_function_and_measure_time) for _ in range(num_calls)]
        for future in futures:
            results.append(future.result())
    return results

# Main execution
if __name__ == "__main__":
    NUM_CALLS = 20  # Total number of function calls
    NUM_THREADS = 5  # Number of threads (parallelism level)

    print(f"Executing {NUM_CALLS} calls with {NUM_THREADS} threads...\n")
    times = execute_in_parallel(NUM_CALLS, NUM_THREADS)

    print("Execution times (seconds):")
    for idx, t in enumerate(times, 1):
        print(f"Call {idx}: {t}")
    
    avg_time = sum(t for t in times if isinstance(t, (int, float))) / len(times)
    print(f"\nAverage execution time: {avg_time:.4f} seconds")