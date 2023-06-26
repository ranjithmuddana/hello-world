/* Hello, World! program in node.js */
console.log("Hello, World!")


pipeline {
    agent any
    
    stages {
        stage('Send Email') {
            steps {
                script {
                    def array2D = [
                        ["Name", "Age", "Country", "Item4", "Item5", "Item6", "Item7"],
                        ["Alice", "25", "USA", "Value4", "Value5", "Value6", "Value7"],
                        ["Bob", "30", "Canada", "Value4", "Value5", "Value6", "Value7"],
                        ["Charlie", "35", "USA", "Value4", "Value5", "Value6", "Value7"]
                    ]
                    
                    def emailTable = """
                    <style>
                    table {
                        border-collapse: collapse;
                        width: 100%;
                    }
                    
                    th, td {
                        border: 1px solid black;
                        padding: 8px;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                    </style>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>${array2D[0].join('</th><th>')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${array2D[1..-1].collect { row ->
                            "<tr><td>${row.join('</td><td>')}</td></tr>"
                        }.join('\n')}
                      </tbody>
                    </table>
                    """
                    
                    emailext (
                        subject: 'Build Status: ${currentBuild.currentResult}',
                        body: """<p>Hi,</p>
                                 <p>The build status is: ${currentBuild.currentResult}</p>
                                 <p>Here is the table:</p>
                                 ${emailTable}
                                 <p>Regards,</p>
                                 <p>Jenkins</p>""",
                        to: 'recipient@example.com',
                        from: 'sender@example.com',
                        replyTo: 'replyto@example.com',
                        mimeType: 'text/html'
                    )
                }
            }
        }
    }
}