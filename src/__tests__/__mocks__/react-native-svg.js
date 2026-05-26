const React = require('react')

function createComponent(name) {
  const Component = (props) => React.createElement(name, props, props.children)
  Component.displayName = name
  return Component
}

module.exports = {
  Svg: createComponent('Svg'),
  Circle: createComponent('Circle'),
  Rect: createComponent('Rect'),
  Path: createComponent('Path'),
  G: createComponent('G'),
  Line: createComponent('Line'),
  Polygon: createComponent('Polygon'),
  Polyline: createComponent('Polyline'),
  Text: createComponent('Text'),
  Defs: createComponent('Defs'),
  Stop: createComponent('Stop'),
  LinearGradient: createComponent('LinearGradient'),
  default: createComponent('Svg'),
}
