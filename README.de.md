libopus.js
==========
[Deutsch](README.de.md), [English](README.en.md), [日本語](README.md)

JavaScript-Implementierung von [Opus](http://opus-codec.org/), einem
verlustbehaftetem Audio Codec. Beispiel, welches Opus in einem Web-Browser de-
und encodieren kann.

Es ist in TypeScript geschrieben．

Demo: https://kazuki.github.io/opus.js-sample/index.html


Details
-------

Diese Opus-JavaScript-Implementierung kompiliert die
[Opus-Implementierung](http://git.xiph.org/?p=opus.git) der Xiph.org Foundation
mit [Emscripten](http://emscripten.org/).

Dieses Beispiel de- und encodiert Opus im Web-Browser und spielt lokal
gespeicherte RIFF PCM Wave-Dateien ab. Zusätzlich zur Messung von De- und
Encodierungsgeschwindigkeit, können Sie das Ergebnis der Encodierung decodieren
und so das Ergebnis vergleichen.

Durch die Verwendung von WebWorkern in diesem Beispiel wird die De-/Encodierung
in einem anderen Thread ausgeführt und beeinträchtigt nicht die Geschwindigkeit
anderer Browseroperationen. Außerdem ist die Decodierungslast von Opus nicht so
hoch, weil die asm.js-Ausgabe von Emscripten bereits sehr optimiert ist, so dass
Opus auch auf Smartphones in Echtzeit decodiert werden kann.

Opus unterstützt nur einige diskrete Abtastraten. Weil der WebAudio-AudioContext
nur mit Abtastraten arbeiten kann, die von der verbauten Hardware und
verwendeten Software abhängig ist, wird in diesem Beispiel ein Resampling mit
Speex durchgeführt.

Verwendete Versionen
--------------------

* opus: master (3a1dc9dc, Tue Aug 4 15:24:21 2015 -0400) speexdsp: 1.2rc3
* (887ac103, Mon Dec 15 01:27:40 2014 -0500) emscripten: v1.34.8

Projekt bauen
-------------

Es steht eine Makefile zur Verfügung, bitte führen Sie die folgenden Befehle
aus. Emscripten muss installiert aktiviert sein, so dass es an Stelle des
Standard C Compilers verwendet wird. Außerdem ist eine Umgebung notwendig, in
der opus und speexsp normalerweise mit gcc usw. erstellt werden können.

    $ git clone --recursive https://github.com/kazuki/opus.js-sample.git
    $ cd opus.js-sample
    $ make

Lizenz
------

Modified BSD license
