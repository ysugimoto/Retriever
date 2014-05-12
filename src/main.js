var fs = require('fs');
var Parser = require('./Parser');

fs.readFile('./template.html', {encoding: 'utf8'}, function(err, data) {
    
    var str = Parser.make(data).parse({
        hoge: 'huga',
        num: 1,
        loopable: true,
        section: [
            {num: 1, hogehoge: 'hugahuga'},
            {num: 2, hogehoge: 'piyopiyo'}
        ]
    });
    //var str = Parser.make(data).parse({
    //        hogehoge: 'piyopiyo'
    //});


    console.log(str);
});

