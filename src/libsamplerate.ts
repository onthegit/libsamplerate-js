/**
 * The entry point into this library. All of the actual resampling work is handled in src.ts
 */

import LoadSRC from "./glue.js";
import { SRC } from "./src";
import { ConverterTypeValue, ConverterType } from "./converter-type";
import { ModuleType } from "./module-type";

/**
 * Options that can be passed to create() when obtaining a copy of SRC.
 */
type CreateOptions = {
	converterType: ConverterTypeValue;
	wasmPath: string;
};

/**
 * Load the libsamplerate wasm module and wrap it in a SRC object.
 *
 * options = {
 *   converterType: {ConverterType} default SRC_SINC_FASTEST
 *   wasmPath:      {String}        default '/libsamplerate.wasm'. set this to the location of your wasm file
 * }
 *
 * @param nChannels the number of output channels. 1-128 supported
 * @param inputSampleRate The sample rate of whatever source audio you want to resample
 * @param outputSampleRate If playing audio in-browser, this should be equal to AudioContext.sampleRate
 * @param options Additional configuration information. see above
 * @returns a promise containing the SRC object on resolve, or error message on error
 */
export function create(
	nChannels: number,
	inputSampleRate: number,
	outputSampleRate: number,
	options?: CreateOptions
): Promise<SRC> {
	const cType =
		options?.converterType === undefined
			? ConverterType.SRC_SINC_FASTEST
			: options?.converterType;
	const wasm = options?.wasmPath || "/libsamplerate.wasm";

	validate(nChannels, inputSampleRate, outputSampleRate, cType);

	const overrides = {
		locateFile: () => {
			return wasm;
		},
	};

	return new Promise((resolve, reject) => {
		LoadSRC(overrides)
			.then((module: ModuleType) => {
				const src = new SRC(
					module,
					cType,
					nChannels,
					inputSampleRate,
					outputSampleRate
				);
				resolve(src);
			})
			.catch((err: Error) => {
				reject(err);
			});
	});
}

export { ConverterType };

/**
 * Validates the input data. Throws if data is invalid
 *
 * @param nChannels the number of output channels. 1-128 supported
 * @param inputSampleRate The sample rate of whatever source audio you want to resample
 * @param outputSampleRate If playing audio in-browser, this should be equal to AudioContext.sampleRate
 * @param cType ConverterType. See above
 */
function validate(
	nChannels: number,
	inputSampleRate: number,
	outputSampleRate: number,
	cType: ConverterTypeValue
) {
	if (nChannels === undefined) throw "nChannels is undefined";
	if (inputSampleRate === undefined) throw "inputSampleRate is undefined";
	if (outputSampleRate === undefined) throw "outputSampleRate is undefined";

	if (nChannels < 1 || nChannels > 128) throw "invalid nChannels submitted";
	if (inputSampleRate < 1 || inputSampleRate > 192000)
		throw "invalid inputSampleRate";
	if (outputSampleRate < 1 || outputSampleRate > 192000)
		throw "invalid outputSampleRate";
	if (
		cType < ConverterType.SRC_SINC_BEST_QUALITY ||
		cType > ConverterType.SRC_LINEAR
	)
		throw "invalid converterType";
}