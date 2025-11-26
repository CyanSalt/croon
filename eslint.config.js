import config from '@cyansalt/eslint-config'

export default config({
  configs: [
    {
      languageOptions: {
        parserOptions: {
          project: [
            './tsconfig.lib.json',
            './tsconfig.node.json',
          ],
        },
      },
    },
  ],
})
