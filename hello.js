/* Hello, World! program in node.js */
console.log("Hello, World!")


def tableData = [
    ["Name", "Age", "City"],
    ["John", "30", "New York"],
    ["Lisa", "25", "Los Angeles"],
    ["Mike", "35", "Chicago"]
]

def formattedTable = ""
tableData.each { row ->
    formattedTable += row.join("|") + "|\n"
}

def message = """
{
  "text": "Table Example",
  "cards": [
    {
      "sections": [
        {
          "widgets": [
            {
              "textParagraph": {
                "text": "$formattedTable"
              }
            }
          ]
        }
      ]
    }
  ],
  "thread": {
    "name": "MyThread"
  }
}
"""

def sendGoogleChatNotification(String webhookUrl, String message) {
    def httpBuilder = new groovyx.net.http.HTTPBuilder(webhookUrl)
    httpBuilder.request(Method.POST, groovyx.net.http.ContentType.JSON) {
        body = message
        response.success = { resp, reader ->
            println("Google Chat notification sent successfully.")
        }
        response.failure = { resp ->
            println("Failed to send Google Chat notification: ${resp.statusLine}")
        }
    }
}

// Call the function to send the Google Chat notification
def webhookUrl = 'your-webhook-url'
sendGoogleChatNotification(webhookUrl, message)