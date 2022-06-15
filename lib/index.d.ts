import { CallExpression, Expression } from '@swc/core';
import Visitor from '@swc/core/Visitor';
export default class ConsoleStripper extends Visitor {
    visitCallExpression(e: CallExpression): Expression;
}
