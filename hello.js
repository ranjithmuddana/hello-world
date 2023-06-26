/* Hello, World! program in node.js */
console.log("Hello, World!")


pipeline {
    agent any
    
    stages {
        stage('Send Email') {
            steps {
                script {
                    def issueDetails = [
                        ["Name", "Age", "Country", "Item1", "Item2", "Item3", "Item4", "Item5"],
                        ["Alice", "25", "USA", "Value1", "Value2", "Value3", "Value4", "Value5"],
                        ["Bob", "30", "Canada", "Value1", "Value2", "Value3", "Value4", "Value5"],
                        ["Charlie", "35", "USA", "Value1", "Value2", "Value3", "Value4", "Value5"]
                    ]
                    
                    def emailTable = """
                    <table style="border-collapse: collapse; width: 100%;">
                      <thead>
                        <tr style="background-color: #f2f2f2;">
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][0]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][1]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][2]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][3]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][4]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][5]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][6]}</th>
                          <th style="border: 1px solid black; padding: 8px;">${issueDetails[0][7]}</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${issueDetails[1..-1].collect { row ->
                            "<tr style='background-color: #ffffff;'><td style='border: 1px solid black; padding: 8px;'>${row[0]}</td><td style='border: 1px solid black; padding: 8px;'>${row[1]}</td><td style='border: 1px solid black; padding: 8px;'>${row[2]}</td><td style='border: 1px solid black; padding: 8px;'>${row[3]}</td><td style='border: 1px solid black; padding: 8px;'>${row[4]}</td><td style='border: 1px solid black; padding: 8px;'>${row[5]}</td><td style='border: 1px solid black; padding: 8px;'>${row[6]}</td><td style='border: 1px solid black; padding: 8px;'>${row[7]}</td></tr>"
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
                                 <p>Regards,</