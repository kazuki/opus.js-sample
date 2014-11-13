libopus.js
==========

非可逆音声符号形式である[Opus](http://opus-codec.org/)のJavaScript実装と，
Webブラウザを用いてOpusのエンコード・デコードを行うサンプルです．

TypeScriptで記述しています．


詳細
----

libopus.jsそのものは，Xiph.org Foundationによる
[Opusの実装](http://git.xiph.org/?p=opus.git)を
[Emscripten](http://emscripten.org/)を使ってコンパイルしたものです．

Webブラウザを用いてOpusのエンコード・デコードを行うサンプルでは，
ローカルに保存してあるRIFF PCM Waveファイルを再生したり，
そのファイルを利用して，エンコード速度・デコード速度を測定するほか，
エンコード結果をデコードし，その結果を再生することが出来ます．

このエンコード・デコード機能のサンプルでは，
WebWorkerを利用し別スレッドでエンコード・デコード処理を行うため，
ブラウザの他の処理に影響を与えません．
また，Opusのデコード負荷がそれほど高くないことと，
Emscriptenが出力するasm.jsは高速に動作するため，スマートフォン上でもOpusのリアルタイムでコードが可能です．

Opusは限られたサンプリングレートにしか対応しておらず，
また，WebAudioのAudioContextは環境に依存したサンプリングレートでしか動作しないため，
このサンプルではSpeexのリサンプラーを利用してサンプリングレートを合わせています．


各種バージョン
--------------

* opus: v1.1.1-beta
* speexdsp: a6930dde (Sat Oct 11 21:38:08 2014 -0400)
* emscripten: v1.26.0

opus/speexdspのビルド方法
-------------------------

Makefileを用意してありますが，makeを実行する前に
opus及びspeexdspをビルドする必要が有ります．
以下の手順でビルドしてからmakeを実行してください．

    $ git clone https://github.com/kazuki/opus.js-sample.git
    $ cd opus.js-sample
    $ git submodule init
    $ git submodule update
    $ cd opus
    $ ./autogen.sh
    $ emconfigure ./configure --disable-extra-programs
    $ emmake make
    $ cd ../speexdsp
    $ ./autogen.sh
    $ emconfigure ./configure
    $ emmake make
    $ cd ..
    $ make

ライセンス
----------

修正BSDライセンス
