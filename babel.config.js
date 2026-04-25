module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@store': './src/store',
            '@queries': './src/queries',
            '@hooks': './src/hooks',
            '@services': './src/services',
            '@repositories': './src/repositories',
            '@lib': './src/lib',
            '@utils': './src/utils',
            '@theme': './src/theme',
            '@types': './src/types',
            '@constants': './src/constants',
            '@config': './src/config',
            '@assets': './assets',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
