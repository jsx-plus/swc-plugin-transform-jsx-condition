function _extends() {
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
        [
            function() {
                return true;
            },
            function() {
                return React.createElement(View, _extends({}, props, {
                    className: "container"
                }), __create_condition__([
                    [
                        function() {
                            return condition;
                        },
                        function() {
                            return React.createElement(View, null, "First");
                        }
                    ]
                ]), __create_condition__([
                    [
                        function() {
                            return condition;
                        },
                        function() {
                            return React.createElement(View, null, "First");
                        }
                    ],
                    [
                        function() {
                            return another;
                        },
                        function() {
                            return React.createElement(View, null, "Second");
                        }
                    ],
                    [
                        function() {
                            return true;
                        },
                        function() {
                            return React.createElement(View, null, "Third");
                        }
                    ]
                ]), /*#__PURE__*/ React.createElement(View, {
                    "x-else": true
                }, "Third"));
            }
        ]
    ]);
}

