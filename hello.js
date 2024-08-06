$(document).ready(function () {
    // Sample data
    var data = [
        { category: 'Fruit', item: 'Apple' },
        { category: 'Vegetable', item: 'Carrot' }
    ];

    // Initialize the jqxGrid
    $("#grid").jqxGrid({
        width: 600,
        height: 400,
        source: new $.jqx.dataAdapter({
            localdata: data,
            datatype: "array",
            datafields: [
                { name: 'category', type: 'string' },
                { name: 'item', type: 'string' }
            ]
        }),
        columns: [
            { text: 'Category', datafield: 'category', width: 200 },
            { text: 'Item', datafield: 'item', width: 200, columntype: 'textbox',
              createeditor: function (row, column, editor) {
                  var category = $('#grid').jqxGrid('getcellvalue', row, 'category');
                  
                  if (category === 'Vegetable') {
                      // Create a dropdown list editor for 'Vegetable'
                      var items = getItemsBasedOnCategory(category);
                      editor.jqxDropDownList({
                          source: items,
                          autoDropDownHeight: true,
                          width: '100%',
                          height: '100%'
                      });
                  } else {
                      // Create a textbox editor for 'Fruit'
                      editor.jqxInput({
                          width: '100%',
                          height: '100%'
                      });
                  }
              },
              initeditor: function (row, column, editor) {
                  var item = $('#grid').jqxGrid('getcellvalue', row, 'item');
                  var category = $('#grid').jqxGrid('getcellvalue', row, 'category');
                  
                  if (category === 'Vegetable') {
                      editor.jqxDropDownList('selectItem', item);
                  } else {
                      editor.val(item);
                  }
              }
            }
        ]
    });

    // Function to get items based on category
    function getItemsBasedOnCategory(category) {
        var items = [];
        switch (category) {
            case 'Fruit':
                items = [];
                break;
            case 'Vegetable':
                items = ['Carrot', 'Potato', 'Tomato'];
                break;
            default:
                items = [];
        }
        return items;
    }

    // Update the editor when the category changes
    $("#grid").on('cellvaluechanged', function (event) {
        var rowindex = event.args.rowindex;
        var datafield = event.args.datafield;
        var value = event.args.value;

        if (datafield === 'category') {
            var column = $('#grid').jqxGrid('getcolumn', 'item');
            var cell = $('#grid').jqxGrid('getcellvalue', rowindex, 'item');
            
            // Refresh the editor for 'item' column
            $('#grid').jqxGrid('beginupdate');
            $('#grid').jqxGrid('setcellvalue', rowindex, 'item', cell); // force update
            $('#grid').jqxGrid('endupdate');
        }
    });
});