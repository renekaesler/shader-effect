export default {
  webgl: {
    vertexShader: `
      precision highp float;
    
      attribute vec2 position;
      varying   vec2 fragCoord;
    
      void main(void) {
        fragCoord   = (position * 0.5) + 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `,
  },
};
