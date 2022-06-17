import { createElement } from 'react';

function Foo(props) {
  return (
    <View {...props} x-if={true} className="container">
      <View x-if={condition}>First</View>
    </View>
  )
}
