var fs = require('fs');
var Parser = require('./Parser');

fs.readFile('./template.html', {encoding: 'utf8'}, function(err, data) {
    
    var str = Parser.make(data).parse({hoge: 'huga', num: 1});

    console.log(str);
});

