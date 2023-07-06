var postcss = require('postcss')
var atImport = require("postcss-import")
var css_variables = require('postcss-css-variables')
var postcss_merge_rules = require('postcss-merge-rules')
var postcss_omit_import_tilde = require('postcss-omit-import-tilde')

var fs = require('fs')

c0 = './themes/light.css'
var c1 = fs.readFileSync(c0, 'utf8')

var c2 = postcss([
  postcss_omit_import_tilde(),
])
.process(c1)
.css

// console.log(c2);

postcss()
  .use(atImport({
    path: ['style', 'node_modules']
  }))
  .process(c2, {
    from: c0 // `from` option is needed here
  })
  .then(function(result) {

    var c3 = postcss([
        css_variables(),
        postcss_merge_rules()
    ])
    .process(result);

    console.log(c3.result)

    let nodes = c3.result.root.nodes
    console.log(nodes)

    nodes.forEach(function(node) {
//      console.log(node.selector)
    })

    c4 = c3.css
//    console.log(c4)

    var c5 = postcss([
      postcss_merge_rules()
    ]).process(c4)
    c5.result.root.nodes.forEach(function(node) {
      let selector = node.selector;
      // .head1
      // --jp-border-color0
      // .jp-
      // .jp-Icon
      // .jp-InputGroup input
      if (selector && selector.indexOf('.jp-InputGroup input') != -1) {
        console.log(selector);
        let nodes = node.nodes;
        nodes.forEach(function(node) {
          console.log('- ' + node.prop + ': ' + node.value)
        })
      }
    })

  })
