Retriever
=========

A simple / lightweight JavaScript template engine ( node / browser )

## Documentation

Class document is available: http://ysugimoto.github.io/Retriever/docs/index.html

---

## How to build ( for browser )

Install task / test tool at global:

```
npm install -g grunt-cli mocha
```

Install development npms

```
npm install .
```

Run the build task

```
grunt build
```

---

## Basic Usage

`Retriever.make(template)` and `parse(params)` will returns parsed string.

### In node

Simple require and call method.

```
var Retriever = require('retriever');
var template  = 'Hello, {{libName}}!'
var bind      = { libName: 'Retriever' };

// will returns 'Hello, Retriever!'
var result = Retriever.make(template).parse(bind);
```

### In browser

Load a build-scripta and call method.

```
<script src="build/retriever.min.js"></script>
<script>
var template = 'Hello, {{libName}}!'
var bind     = { libName: 'Retriever' };

// will returns 'Hello, Retriever!'
var result = Retriever.make(template).parse(bind);
</script>
```

bind value is always escape for HTML.

## Supported sections

### if-elseif-else

```
var template = "{{if dat == 'foo'}}foo{{else if dat == 'bar'}}bar{{else}}baz{{/if}}"
var bind     = { dat: 'bar' };

// will returns 'bar'
var result = Retriever.make(template).parse(bind);
```

#### Supported features

- Relational operators: `>`, `<`, `>=`, `<=`, `==`. `===`, `!=`, `!==`
- Logical operators: `&&`, `||`
- Calculation like: `{{if a + b > 100 * 10}}` ( a, b is supplied from parser parameter )

### loop

When `Array<Object>` loop, index can access:

```
var template = "{{loop section}}{{value}}{{/loop}}"
var bind     = {
    section: [
        { value: 'foo' },
        { value: 'bar' },
        { value: 'baz' }
    ]
};

// will returns 'foobarbaz'
var result = Retriever.make(template).parse(bind);
```

When `Array<Number|String|Booelan>` loop,  index can access through `@data` index:

```
var template = "{{loop list}}{{@data}}{{/loop}}"
var bind     = { list: [1, 2, 3, 4, 5, 6] };

// will returns '123456'
var result = Retriever.make(template).parse(bind);
```

In the above case, It can access parent Object through `@parent` index:

```
var template = "{{loop list}}{{@data}}{{@parent.foo}}{{/loop}}"
var bind     = { foo: 'bar', list: [1, 2, 3, 4, 5, 6] };

// will returns '1bar2bar3bar4bar5bar6bar'
var result = Retriever.make(template).parse(bind);
```

And Enable to use nested section.


