import {CallExpression, Expression} from '@swc/core';
import Visitor from '@swc/core/Visitor'

export default class ConsoleStripper extends Visitor {
  visitCallExpression(e: CallExpression): Expression {
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
        }
      }
    }

    return e
  }
}
