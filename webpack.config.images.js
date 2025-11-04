//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports =
	/**
	 * @param {{ useOptimization?: boolean } | undefined } env
	 * @param {{ mode: 'production' | 'development' | 'none' | undefined }} argv
	 * @returns { WebpackConfig }
	 */
	function (env, argv) {
		const mode = argv.mode || 'none';
		const basePath = path.join(__dirname, 'src', 'webviews', 'apps');

		env = {
			useOptimization: false,
			...env,
		};

		/** @type ImageMinimizerPlugin.Generator<any> */
		// @ts-ignore
		const imageGeneratorConfig = {
			type: 'asset',
			implementation: ImageMinimizerPlugin.sharpGenerate,
			options: {
				encodeOptions: {
					webp: {
						lossless: true,
						quality: 100,
						effort: mode === 'production' ? 6 : 0,
					},
				},
			},
		};

		/** @type WebpackConfig['plugins'] */
		const plugins = [
			new CopyPlugin({
				patterns: [
					{
						from: path.posix.join(basePath.replace(/\\/g, '/'), 'images', 'settings', '*.png'),
						to: __dirname.replace(/\\/g, '/'),
					},
				],
			}),
		];

		if (!env.useOptimization) {
			plugins.push(
				new ImageMinimizerPlugin({
					deleteOriginalAssets: true,
					generator: [imageGeneratorConfig],
				}),
			);
		}

		/** @type WebpackConfig */
		const config = {
			name: 'images',
			context: basePath,
			entry: {},
			mode: mode,
			plugins: plugins,
		};

		if (env.useOptimization) {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ImageMinimizerPlugin({
						deleteOriginalAssets: true,
						generator: [imageGeneratorConfig],
					}),
				],
			};
		}

		return config;
	};
