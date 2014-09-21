EMCC_OPTS:=-O3 --llvm-lto 1 --memory-init-file 0 -s DEFAULT_LIBRARY_FUNCS_TO_INCLUDE=[] -s LIBRARY_DEPS_TO_AUTOEXPORT=[] -s INLINING_LIMIT=1 -s INVOKE_RUN=0

TS_SOURCES:=$(shell find . -maxdepth 1 -name '*.ts' -and -type f)
JS_TARGETS:=$(subst .ts,.js,$(TS_SOURCES))

OPUS_OBJS:=./opus/.libs/libopus.a
SPEEXDSP_OBJS:=./speexdsp/libspeexdsp/.libs/libspeexdsp.a
OPUS_SPEEXDSP_OBJS:=$(OPUS_OBJS) $(SPEEXDSP_OBJS)

OPUS_ENCODER_EXPORTS:='_opus_encoder_create','_opus_encode','_opus_encode_float','_opus_encoder_ctl','_opus_encoder_destroy'
OPUS_DECODER_EXPORTS:='_opus_decoder_create','_opus_decode','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy'
OPUS_EXPORTS:='_opus_get_version_string',$(OPUS_ENCODER_EXPORTS),$(OPUS_DECODER_EXPORTS)
SPEEXDSP_EXPORTS:='_speex_resampler_init','_speex_resampler_destroy','_speex_resampler_process_int','_speex_resampler_process_float','_speex_resampler_process_interleaved_float'

ALL_TARGETS:=libopus.js libspeexdsp.js libopus_libspeexdsp.js $(JS_TARGETS)

all: $(ALL_TARGETS)
clean:
	rm -f $(ALL_TARGETS)

libopus.js: $(OPUS_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_EXPORTS)]" $(OPUS_OBJS) -o $@

libopus.encoder.js: $(OPUS_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_ENCODER_EXPORTS)]" $(OPUS_OBJS) -o $@

libopus.decoder.js: $(OPUS_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_DECODER_EXPORTS)]" $(OPUS_OBJS) -o $@

libopus.encoder_libspeexdsp.js: $(OPUS_SPEEXDSP_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_ENCODER_EXPORTS),$(SPEEXDSP_EXPORTS)]" $(OPUS_SPEEXDSP_OBJS) -o $@

libopus.decoder_libspeexdsp.js: $(OPUS_SPEEXDSP_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_DECODER_EXPORTS),$(SPEEXDSP_EXPORTS)]" $(OPUS_SPEEXDSP_OBJS) -o $@

libspeexdsp.js: $(SPEEXDSP_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(SPEEXDSP_EXPORTS)]" $(SPEEXDSP_OBJS) -o $@

libopus_libspeexdsp.js: $(OPUS_SPEEXDSP_OBJS)
	emcc $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_EXPORTS),$(SPEEXDSP_EXPORTS)]" $(OPUS_SPEEXDSP_OBJS) -o $@

%.js: %.ts
	tsc $<
