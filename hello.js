<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://www.jqwidgets.com/public/jqwidgets/styles/jqx.base.css" type="text/css" />
    <link rel="stylesheet" href="https://www.jqwidgets.com/public/jqwidgets/styles/jqx.light.css" type="text/css" />
    <script type="text/javascript" src="https://www.jqwidgets.com/public/jqwidgets/jqx-all.js"></script>
    <style>
        .invalid-input {
            border: 1px solid red !important;
        }
    </style>
</head>
<body>
    <div id="grid"></div>

    <script type="text/javascript">
        $(document).ready(function () {
            var source = [
                { name: 'John', country: 'USA' },
                { name: 'Anna', country: 'Germany' },
                { name: 'Peter', country: 'Sweden' }
            ];

            var comboBoxSource = ['USA', 'Germany', 'Sweden'];

            $("#grid").jqxGrid({
                width: 600,
                height: 400,
                source: new $.jqx.dataAdapter({
                    localdata: source,
                    datatype: 'array',
                    datafields: [
                        { name: 'name', type: 'string' },
                        { name: 'country', type: 'string' }
                    ]
                }),
                columns: [
                    { text: 'Name', dataField: 'name', width: 200 },
                    {
                        text: 'Country',
                        dataField: 'country',
                        width: 400,
                        cellsrenderer: function (row, column, value, defaultHtml, columnSettings, rowData) {
                            return `<div id="comboBox${row}" class="jqxComboBox"></div>`;
                        },
                        createeditor: function (row, column, editor, cellValue, cellText) {
                            editor.jqxComboBox({
                                source: comboBoxSource,
                                autoComplete: false,
                                width: '100%',
                                height: '100%'
                            });
                        },
                        cellvaluechanging: function (row, column, oldValue, newValue) {
                            // Validate new value
                            if (comboBoxSource.indexOf(newValue) === -1) {
                                // Reset value to oldValue if newValue is not valid
                                $("#grid").jqxGrid('setcellvalue', row, column, oldValue);
                                return false; // Prevent the cell value change
                            }
                            return true; // Allow the cell value change
                        }
                    }
                ]
            });
        });
    </script>
</body>
</html>