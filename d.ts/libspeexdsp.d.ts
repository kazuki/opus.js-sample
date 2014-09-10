declare function _speex_resampler_init(nb_channels: number,
                                       in_rate: number,
                                       out_rate: number,
                                       quality: number,
                                       err_ptr: number): number;
declare function _speex_resampler_destroy(st: number): void;
declare function _speex_resampler_process_int(st: number,
                                              channel_index: number,
                                              in_ptr: number,
                                              in_len_ptr: number,
                                              out_ptr: number,
                                              out_len_ptr: number): number;
declare function _speex_resampler_process_float(st: number,
                                                channel_index: number,
                                                in_ptr: number,
                                                in_len_ptr: number,
                                                out_ptr: number,
                                                out_len_ptr: number): number;
declare function _speex_resampler_process_interleaved_float(st: number,
                                                            in_ptr: number,
                                                            in_len_ptr: number,
                                                            out_ptr: number,
                                                            out_len_ptr: number): number;
declare function _speex_resampler_get_input_stride(st: number,
                                                   stride_ptr: number);
declare function _speex_resampler_get_output_stride(st: number,
                                                    stride_ptr: number);
declare function _speex_resampler_get_input_latency(st: number): number;
declare function _speex_resampler_get_output_latency(st: number): number;
