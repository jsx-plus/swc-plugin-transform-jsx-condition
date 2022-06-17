const swc = require('@swc/core')
const path = require('path')
const JSXConditionTransformPlugin = require(path.join(__dirname, '../lib/index.js')).default;

it('should convert jsx x-if condition', () => {

  let input = `import { createElement } from 'react';

function Foo(props) {
  return (
    <View {...props} x-if={true} className="container">
      <View x-if={condition}>First</View>
    </View>
  )
}`;

  const transformedOutput = swc.transformSync(input, {
    jsc: {
      parser: {
        jsx: true
      },
    },
    plugin: JSXConditionTransformPlugin
  });

  const output = `function _extends() {
    _extends = Object.assign || function(target) {
        for(var i = 1; i < arguments.length; i++){
            var source = arguments[i];
            for(var key in source){
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
        return target;
    };
    return _extends.apply(this, arguments);
}
import { createCondition as __create_condition__ } from "babel-runtime-jsx-plus";
import { createElement } from "react";
function Foo(props) {
    return __create_condition__([
        function() {
            return true;
        },
        function() {
            return React.createElement(View, _extends({}, props, {
                className: "container"
            }), __create_condition__([
                function() {
                    return condition;
                },
                function() {
                    return React.createElement(View, null, "First");
                }
            ]));
        }
    ]);
}
`;

  expect(transformedOutput.code).toBe(output);
});
