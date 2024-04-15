import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/shader-effect.js'),
      name: 'ShaderEffect',
      fileName: 'shader-effect',
    },
  }
});
