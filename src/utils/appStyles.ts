import { isIOS } from "./constant";

export const getShadowStyle = (elevation = 4, shadowColor = '#000') => {
    if (isIOS) {
        return {
            shadowColor,
            shadowOffset: {
                width: 0,
                height: elevation * 0.5,
            },
            shadowOpacity: 0.3,
            shadowRadius: elevation,
        };
    } else {
        return {
            elevation,
        };
    }
};
