/* Hello, World! program in node.js */
console.log("Hello, World!")


pipeline {
    agent any
    
    stages {
        stage('Send Email') {
            steps {
                script {
                    def array2D = [
                        ["Name", "Age", "Country"],
                        ["Alice", "25", "USA"],
                        ["Bob", "30", "Canada"],
                        ["Charlie", "35", "USA"]
                    ]
                    
                    def emailTable = """
                    <table>
                      <thead>
                        <tr>
                          <th>${array2D[0][0]}</th>
                          <th>${array2D[0][1]}</th>
                          <th>${array2D[0][2]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${array2D[1..-1].collect { row ->
                            "<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>"
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