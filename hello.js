
**Issue Explanation:**

**Service #1**:
- Checks for pending status and makes an API call to Service #2 to assign tasks.
- Scheduled to run every 60 seconds.

**Service #2**:
- Changes the status of tasks to ASSIGNED.
- Takes around 70 seconds to process each task.

**Problem**:
1. Service #1 runs every 60 seconds, checking for pending tasks and sending assignment requests.
2. Service #2 takes 70 seconds to process and change the status to ASSIGNED.
3. Due to this timing mismatch, Service #1 sends duplicate requests before Service #2 finishes processing.
4. This causes Service #2 to reprocess the same task.

**Summary**:
The timing mismatch between the 60-second interval of Service #1 and the 70-second processing time of Service #2 results in duplicate task processing.

**Possible Solutions**:
1. Increase Service #1's interval to more than 70 seconds (e.g., 80 seconds).
2. Implement a check in Service #1 to recognize and skip tasks already in progress.
3. Update Service #2 to mark tasks as "In Progress" at the start of processing to prevent reassignment.

---