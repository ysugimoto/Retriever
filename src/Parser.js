var IfContext  = require('./IfContext');

function Parser(template) {
    this.tpl  = template.split('');
    this.size = template.length;
    this.idx  = 0;
    this.mode = Parser.STATUS_NORMAL;
    this.leftDelimiter  = '{{';
    this.rightDelimiter = '}}';
    this.processTree = [];
    this.currentParam = {};
    this.parsed = [];
    this.line = 0;
}

Parser.make = function(template) {
    return new Parser(template);
};

Parser.STATUS_NORMAL  = 0x00;
Parser.STATUS_IF      = 0x01;
Parser.STATUS_LOOP    = 0x10;
Parser.STATUS_PARSING = 0x11;

Parser.prototype.parse = function(param) {
    var stack = "",
        regex = new RegExp('^' + this.leftDelimiter + '([/])?(.+?)' + this.rightDelimiter + '$'),
        parse = "",
        tmp,
        m,
        c,
        cc = "";

    this.currentParam = param;

    while ( this.idx <= this.size ) {
        c = this.tpl[this.idx];

        if ( c + this.tpl[this.idx + 1] === this.leftDelimiter ) {
            console.log('Left Delimiter start');
            this.mode = Parser.STATUS_PARSING;
            this.parsed.pop();
            stack = this.leftDelimiter;
            this.idx++;
        }

        else if ( c + this.tpl[this.idx + 1] === this.rightDelimiter ) {
            if ( this.mode == Parser.STATUS_NORMAL ) {
                throw new Error('Unexpexted right delimiter chars: ' + this.rightDelimiter + ' at line ' + this.line);
            }
            stack += this.rightDelimiter;
            m = regex.exec(stack);
            if ( ! m[1] ) {
                tmp = this.openProcess(m[2]);
                console.log(m[2], tmp);
                if ( tmp === false ) {
                    parse += this.leftDelimiter + m[2] + this.rightDelimiter;
                } else if ( tmp !== "" ) {
                    this.parsed[this.parsed.length] = tmp;
                }
            } else {
                this.parsed[this.parsed.length] = this.closeProcess(m[2], parse, param);
                parse = "";
            }
            stack = "";
            this.idx++;
        }

        else if ( this.mode === Parser.STATUS_PARSING ) {
            stack += c;
        }
        else if ( this.mode === Parser.STATUS_IF || this.mode === Parser.STATUS_LOOP ) {
            parse += c;
        }
        else {
            this.parsed[this.parsed.length] = c;
        }

        if ( c === "\n" ) {
            ++this.line;
        }

        ++this.idx;
    }

    return this.parsed.join('');

};

Parser.prototype.openProcess = function(mode) {
    var val = "";

    if ( /^if\s/.test(mode) ) {
        this.mode = Parser.STATUS_IF;
        this.processTree.push({
            mode: this.mode,
            condition: mode.replace(/^if\s(.+?)$/, '$1')
        });
    } else if ( /^else/.test(mode) ) {
        val = false;
        this.mode = Parser.STATUS_IF;
    } else if ( /^loop/.test(mode) ) {
        this.mode = Parser.STATUS_LOOP;
        this.processTree.push({
            mode: this.mode,
            condition: mode.replace(/^loop\s(.+?)$/, '$1')
        });
        this.currentParam =
    } else {
        val = this.getRecursiveValue(mode, this.param);
        this.mode = Parser.STATUS_NORMAL;
    }

    return val;
};

Parser.prototype.closeProcess = function(mode, context) {
    var proc = this.processTree.pop(),
        parser,
        list,
        size,
        stack = [],
        i = 0,
        piece = '';

    switch ( mode ) {
        case 'if':
            if ( proc.mode !== Parser.STATUS_IF ) {
                throw new Error('Syntax Error: IF Compare section is not matched. at line ' + this.line);
            }
            parser = new IfContext(proc.condition, context);
            piece = parser.exec(param);
            break;

        case 'loop':
            if ( proc.mode !== Parser.STATUS_LOOP ) {
                throw new Error('Syntax Error: Compare section is not matched. at line ' + this.line);
            }
            list = this.getRecursiveValue(proc.condition, param) || [];
            size = list.length;
            for ( ; i < size; ++i ) {
                console.log(context, list[i]);
                stack[stack.length] = Parser.make(context).parse(list[i] || {});
            }

            piece = stack.join('\n');
            break;
    }

    this.mode = Parser.STATUS_NORMAL;
    return piece;
};

Parser.prototype.getRecursiveValue = function(key, param) {
    var point = key.indexOf('.'),
        k;

    // key has not contain dot
    if ( point === -1 ) {
        return param[key] || null;
    }

    k = key.slice(0, point);

    if ( ! ( k in param ) || typeof params[k] !== 'object' ) {
        return null;
    }

    return this.getRecursiveValue(k.slice(++point), param[k]);
};

module.exports = Parser;
