"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Visitor_1 = __importDefault(require("@swc/core/Visitor"));
class ConsoleStripper extends Visitor_1.default {
    visitCallExpression(e) {
        if (e.callee.type !== 'MemberExpression') {
            return e;
        }
        if (e.callee.object.type === 'Identifier' && e.callee.object.value === 'console') {
            if (e.callee.property.type === 'Identifier') {
                return {
                    type: "UnaryExpression",
                    span: e.span,
                    operator: 'void',
                    argument: {
                        type: 'NumericLiteral',
                        span: e.span,
                        value: 0
                    }
                };
            }
        }
        return e;
    }
}
exports.default = ConsoleStripper;
