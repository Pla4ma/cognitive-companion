// Mock for react-native-view-shot
module.exports = {
  captureRef: jest.fn(() => Promise.resolve('file:///mock-screenshot.png')),
  captureScreen: jest.fn(() => Promise.resolve('file:///mock-screenshot.png')),
}
