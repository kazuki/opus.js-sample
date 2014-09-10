declare function _opus_encoder_create(sampling_rate: number,
                                      channels: number,
                                      application: any,
                                      error_ptr: number): number;
declare function _opus_encode(handle: number,
                              pcm: number,
                              frame_size: number,
                              data: number,
                              max_data_bytes: number): number;
declare function _opus_encode_float(handle: number,
                                    pcm: number,
                                    frame_size: number,
                                    data: number,
                                    max_data_bytes: number): number;
declare function _opus_encoder_destroy(handle: number): void;

declare function _opus_decoder_create(sampling_rate: number,
                                      channels: number,
                                      error_ptr: number): number;
declare function _opus_decode(handle: number,
                              data: number,
                              len: number,
                              pcm: number,
                              frame_size: number,
                              decode_fec: number): number;
declare function _opus_decode_float(handle: number,
                                    data: number,
                                    len: number,
                                    pcm: number,
                                    frame_size: number,
                                    decode_fec: number): number;
declare function _opus_decoder_destroy(handle: number): void;

declare function _opus_get_version_string(): number;

//'_opus_encoder_create','_opus_encode','_opus_encode_float','_opus_encoder_destroy','_opus_encoder_ctl','_opus_decoder_create','_opus_decode','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy'