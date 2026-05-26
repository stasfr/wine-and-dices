// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  files: ['layers/**/pages/**/*.vue'],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
});
