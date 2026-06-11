// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

jest.mock('@lottiefiles/dotlottie-react', () => ({
  DotLottieReact: () => <div data-testid="dotlottie" />
}));

jest.mock('react-pdf', () => ({
  Document: ({ children }) => <div>{children}</div>,
  Page: () => <div data-testid="pdf-page" />,
  pdfjs: {
    GlobalWorkerOptions: {
      workerSrc: ''
    }
  }
}));

jest.mock('ogl', () => {
  class Renderer {
    constructor() {
      this.gl = {
        canvas: globalThis.document.createElement('canvas'),
        POINTS: 0,
        clearColor: jest.fn()
      };
    }
    setSize() {}
    render() {}
  }
  class Camera {
    constructor() {
      this.position = { set: jest.fn() };
    }
    perspective() {}
  }
  class Geometry {}
  class Program {
    constructor() {
      this.uniforms = { uTime: { value: 0 } };
    }
  }
  class Mesh {
    constructor() {
      this.position = { x: 0, y: 0 };
      this.rotation = { x: 0, y: 0, z: 0 };
    }
  }
  return { Renderer, Camera, Geometry, Program, Mesh };
});

jest.mock('three/examples/jsm/loaders/GLTFLoader', () => ({
  GLTFLoader: class {
    load(_url, onLoad) {
      onLoad?.({ scene: { traverse: jest.fn() } });
    }
  }
}));
