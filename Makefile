NATIVE_DIR=./native

EMCC_OPTS=-O3 --llvm-lto 1 --memory-init-file 0 -s BUILD_AS_WORKER=1 \
          -s NO_FILESYSTEM=1 -s NO_BROWSER=1 -s EXPORTED_FUNCTIONS="['_malloc']" -s EXPORTED_RUNTIME_METHODS="['setValue', 'getValue']"

OPUS_DIR=$(NATIVE_DIR)/opus
OPUS_OBJ=$(OPUS_DIR)/.libs/libopus.a

SPEEXDSP_DIR=$(NATIVE_DIR)/speexdsp
SPEEXDSP_OBJ=$(SPEEXDSP_DIR)/libspeexdsp/.libs/libspeexdsp.a

OPUS_ENCODER=opus_encoder.js
OPUS_DECODER=opus_decoder.js
OPUS_ENCODER_EXPORTS:='_opus_encoder_create','_opus_encode_float','_opus_encoder_ctl','_opus_encoder_destroy'
OPUS_DECODER_EXPORTS:='_opus_decoder_create','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy'
SPEEXDSP_EXPORTS:='_speex_resampler_init','_speex_resampler_destroy','_speex_resampler_process_interleaved_float'

TARGETS=$(OPUS_OBJ) $(SPEEXDSP_OBJ) test.js resampler.js $(OPUS_ENCODER) $(OPUS_DECODER)

all: $(TARGETS)
clean:
	(cd $(OPUS_DIR); rm -rf *; git reset --hard); \
	(cd $(SPEEXDSP_DIR); rm -rf *; git reset --hard); \
	rm -f $(TARGETS)

test.js: *.ts
	tsc --out $@ test.ts

resampler.js: resampler.ts
	tsc --out .resampler.js resampler.ts && \
	emcc -o $@ $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(SPEEXDSP_EXPORTS)]" --post-js .resampler.js $(SPEEXDSP_OBJ)

$(OPUS_ENCODER): $(OPUS_OBJ) $(SPEEXDSP_OBJ) opus_encoder.ts
	tsc --out .opus_encoder.js opus_encoder.ts && \
	emcc -o $@ $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_ENCODER_EXPORTS),$(SPEEXDSP_EXPORTS)]" --post-js .opus_encoder.js $(OPUS_OBJ) $(SPEEXDSP_OBJ)

$(OPUS_DECODER): $(OPUS_OBJ) $(SPEEXDSP_OBJ) opus_decoder.ts
	tsc --out .opus_decoder.js opus_decoder.ts && \
	emcc -o $@ $(EMCC_OPTS) -s EXPORTED_FUNCTIONS="[$(OPUS_DECODER_EXPORTS),$(SPEEXDSP_EXPORTS)]" --post-js .opus_decoder.js $(OPUS_OBJ) $(SPEEXDSP_OBJ)

$(OPUS_OBJ): $(OPUS_DIR)/Makefile
	cd $(OPUS_DIR); emmake make
$(OPUS_DIR)/Makefile: $(OPUS_DIR)/configure
	cd $(OPUS_DIR); emconfigure ./configure --disable-extra-programs --disable-doc
$(OPUS_DIR)/configure:
	cd $(OPUS_DIR); ./autogen.sh
$(SPEEXDSP_OBJ): $(SPEEXDSP_DIR)/Makefile
	cd $(SPEEXDSP_DIR); emmake make
$(SPEEXDSP_DIR)/Makefile: $(SPEEXDSP_DIR)/configure
	cd $(SPEEXDSP_DIR); emconfigure ./configure --disable-examples
$(SPEEXDSP_DIR)/configure:
	cd $(SPEEXDSP_DIR); ./autogen.sh
