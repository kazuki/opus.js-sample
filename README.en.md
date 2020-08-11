libopus.js
==========
[Deutsch](README.de.md), [English](README.en.md), [日本語](README.md)

JavaScript implementation of [Opus](http://opus-codec.org/), a lossy audio
codec. This is an example capable of de- and encoding Opus in a web browser.

Written in TypeScript.

Demo: https://kazuki.github.io/opus.js-sample/index.html


Details
-------

This Opus-JavaScript implementation compiles Xiph.org Foundation's
[Opus-implementation](http://git.xiph.org/?p=opus.git) using
[Emscripten](http://emscripten.org/).

This example de- and encodes Opus in a web browser and plays locally stored RIFF
PCM Wave-Files. Apart from measuring de-and encoding speed you can decode the
result of the encoding and therefore compare the result.

The use WebWorkers in this example causes the encoding and decoding operation to
take place in a different thread and therefore avoiding impact on the overall
browsing experience. Additionally, the load of decoding Opus isn't that high and
asm.js created by Emscripten operates at high speed, allowing near real-time
decoding even on a smartphone.

Opus only supports some discrete sample rates while the WebAudio AudioContext
can only work with sample rates supported by the underlying hard- and software
stack. That's why the Speex resampler was added to this example.

Versions
--------

* opus: master (3a1dc9dc, Tue Aug 4 15:24:21 2015 -0400) speexdsp: 1.2rc3
* (887ac103, Mon Dec 15 01:27:40 2014 -0500) emscripten: v1.34.8

Building the project
--------------------

There is a Makefile; please execute the following commands. Emscripten has to be
installed and activated so that is used instead of the default C compiler.
Additionally, there has to be an environment similar to the one required for
building opus and speexsp with gcc.

    $ git clone --recursive https://github.com/kazuki/opus.js-sample.git
    $ cd opus.js-sample
    $ make

Lizenz
------

Modified BSD license
