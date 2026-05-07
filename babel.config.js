module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        // babel-preset-expo가 react-native-reanimated/plugin (worklets 포함)을
        // 자동 주입하므로 여기서 수동으로 또 넣으면 워클릿이 중첩 변환되어
        // 런타임에 "property 'react' doesn't exist" 등 에러가 난다.
    };
};
