include ./opus/celt_sources.mk
include ./opus/silk_sources.mk
include ./opus/opus_sources.mk

CELT_OBJS:=$(CELT_SOURCES:%.c=./opus/%.o)
SILK_OBJS:=$(SILK_SOURCES:%.c=./opus/%.o)
OPUS_OBJS:=$(OPUS_SOURCES:%.c=./opus/%.o) $(OPUS_SOURCES_FLOAT:%.c=./opus/%.o)

EXPORTED_FUNCTIONS:="['_opus_encoder_get_size','_opus_encoder_create','_opus_encoder_init','_opus_encode','_opus_encode_float','_opus_encoder_destroy','_opus_encoder_ctl','_opus_decoder_get_size','_opus_decoder_create','_opus_decoder_init','_opus_decode','_opus_decode_float','_opus_decoder_ctl','_opus_decoder_destroy','_opus_packet_parse','_opus_packet_get_bandwidth','_opus_packet_get_samples_per_frame','_opus_packet_get_nb_channels','_opus_packet_get_nb_frames','_opus_packet_get_nb_samples','_opus_decoder_get_nb_samples','_opus_pcm_soft_clip','_opus_repacketizer_get_size','_opus_repacketizer_init','_opus_repacketizer_create','_opus_repacketizer_destroy','_opus_repacketizer_cat','_opus_repacketizer_out_range','_opus_repacketizer_get_nb_frames','_opus_repacketizer_out','_opus_strerror','_opus_get_version_string','_opus_multistream_encoder_get_size','_opus_multistream_encoder_create','_opus_multistream_encoder_init','_opus_multistream_encode','_opus_multistream_encode_float','_opus_multistream_encoder_destroy','_opus_multistream_encoder_ctl','_opus_multistream_decoder_get_size','_opus_multistream_decoder_create','_opus_multistream_decoder_init','_opus_multistream_decode','_opus_multistream_decode_float','_opus_multistream_decoder_ctl','_opus_multistream_decoder_destroy']"
EXPORTED_GLOBALS:="[]"
LIBOPUS_EMCC_OPTS:=-O2 -s EXPORTED_FUNCTIONS=$(EXPORTED_FUNCTIONS) -s INVOKE_RUN=0 -s EXPORTED_GLOBALS=$(EXPORTED_GLOBALS)

all: libopus.js

libopus.js: $(CELT_OBJS) $(SILK_OBJS) $(OPUS_OBJS)
	emcc $(LIBOPUS_EMCC_OPTS) $(CELT_OBJS) $(SILK_OBJS) $(OPUS_OBJS) -o $@
