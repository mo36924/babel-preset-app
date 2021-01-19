import "./module";
import process from "process";
import type { ConfigAPI, default as babel, TransformOptions } from "@babel/core";
import env, { Options as envOptions } from "@babel/preset-env";
import react from "@babel/preset-react";
import commonjs, { Options as commonjsOptions } from "@mo36924/babel-plugin-commonjs";
import deadCodeElimination from "@mo36924/babel-plugin-dead-code-elimination";
import iifeUnwrap from "@mo36924/babel-plugin-iife-unwrap";
import inject, { Options as injectOptions } from "@mo36924/babel-plugin-inject";
import replace from "@mo36924/babel-plugin-replace";
import resolve, { Options as resolveOptions } from "@mo36924/babel-plugin-resolve";

type Api = ConfigAPI & typeof babel;

export type Options = {
  env?: "production" | "development" | "test";
  target?: "node" | "module" | "nomodule";
  jsx?: string;
  inject?: injectOptions;
  namedExports?: commonjsOptions["namedExports"];
};

const { NODE_ENV, NODE_TARGET } = process.env;

export default (api: Api, options: Options): TransformOptions => {
  const {
    env: __ENV__ = NODE_ENV ?? "production",
    target: __TARGET__ = NODE_TARGET ?? "node",
    jsx = "react",
    inject: _inject = {},
    namedExports = {},
  } = options;

  const __PROD__ = __ENV__ === "production" || undefined;
  const __DEV__ = __ENV__ === "development" || undefined;
  const __TEST__ = __ENV__ === "test" || undefined;
  const __NODE__ = __TARGET__ === "node" || undefined;
  const __BROWSER__ = !__NODE__ || undefined;
  const __MODULE__ = __TARGET__ === "module" || undefined;
  const __NOMODULE__ = __TARGET__ === "nomodule" || undefined;

  if (jsx === "react") {
    for (const mod of [
      "react",
      "react-dom",
      "react-dom/server",
      "react-dom/server.browser",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
    ]) {
      try {
        // eslint-disable-next-line import/no-dynamic-require
        namedExports[mod] = Object.keys(require(mod));
      } catch {}
    }
  }

  return {
    presets: [
      [
        env,
        {
          bugfixes: true,
          modules: false,
          loose: false,
          ignoreBrowserslistConfig: true,
          targets: __NODE__
            ? {
                node: true,
              }
            : __MODULE__
            ? {
                esmodules: true,
              }
            : {
                android: "4.4",
                chrome: "41",
                edge: "16",
                firefox: "60",
                ie: "11",
                ios: "10.3",
                opera: "48",
                safari: "10.1",
                samsung: "8.2",
              },
          useBuiltIns: false,
          debug: __DEV__,
        } as envOptions,
      ],
      [
        react,
        {
          runtime: "automatic",
          development: __DEV__,
          importSource: jsx,
        },
      ],
    ],
    plugins: [
      [
        replace,
        {
          "typeof self": __NODE__ ? "'undefined'" : "'object'",
          "typeof global": __NODE__ ? "'object'" : "'undefined'",
          "typeof process": "'object'",
          "process.env.NODE_ENV": `'${__ENV__}'`,
          __ENV__: `'${__ENV__}'`,
          __TARGET__: `'${__TARGET__}'`,
          __PROD__: `${__PROD__}`,
          __DEV__: `${__DEV__}`,
          __TEST__: `${__TEST__}`,
          __NODE__: `${__NODE__}`,
          __BROWSER__: `${__BROWSER__}`,
          __MODULE__: `${__MODULE__}`,
          __NOMODULE__: `${__NOMODULE__}`,
          ...(__MODULE__ ? { "typeof Event": "'function'" } : {}),
        },
      ],
      [deadCodeElimination],
      [iifeUnwrap],
      [
        resolve,
        {
          ignoreBuiltins: __NODE__,
          aliasFields: __NODE__ ? [] : ["browser"],
          mainFields: __NODE__ ? ["module", "main"] : ["browser", "module", "main"],
          conditionNames: __NODE__ ? ["import"] : ["browser", "import"],
          extensions: [".tsx", ".ts", ".jsx", ".mjs", ".js", ".json"],
          ignore: [/^\0/],
        } as resolveOptions,
      ],
      [commonjs, __NODE__ ? ({ namedExports } as commonjsOptions) : false],
      [inject, _inject],
    ],
  };
};
