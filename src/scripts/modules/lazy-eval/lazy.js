"use strict";
export const lazy = (getter) => {
    let evaluated = false;
    let _res = null;
    const res = function () {
        if (evaluated)
            return _res;
        _res = getter.apply(this, arguments);
        evaluated = true;
        return _res;
    };
    res.isLazy = true;
    res.then = (modifier) => modifier(res());
    res.map = (mapper) => lazy(() => mapper(res()));
    return res;
};