<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://www.jqwidgets.com/public/jqwidgets/styles/jqx.base.css" type="text/css" />
    <script type="text/javascript" src="https://www.jqwidgets.com/public/jqwidgets/jqx-all.js"></script>
    <style>
        .invalid-input {
            border: 1px solid red !important;
        }
    </style>
</head>
<body>
    <div id="comboBox"></div>

    <script type="text/javascript">
        $(document).ready(function () {
            var source = ['Option 1', 'Option 2', 'Option 3'];

            $("#comboBox").jqxComboBox({
                source: source,
                autoComplete: false,  // Disable auto-complete
                width: '200px',
                height: '25px',
                autoDropDownHeight: true,
                enableBrowserBoundsDetection: true // Helps with dropdown positioning
            });

            $("#comboBox").on('change', function (event) {
                var selectedItem = event.args.item ? event.args.item.value : '';
                if (source.indexOf(selectedItem) === -1) {
                    $(this).addClass('invalid-input');
                    // Optionally clear the invalid value
                    $(this).jqxComboBox('clearSelection');
                } else {
                    $(this).removeClass('invalid-input');
                }
            });
        });
    </script>
</body>
</html>